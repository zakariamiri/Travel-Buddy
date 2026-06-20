"""
FastAPI server for Travel-Buddy AI.

Run:
  python -m uvicorn api:app --host 0.0.0.0 --port 8000

Local behavior:
- If an NVIDIA/CUDA GPU is available, the API loads the fine-tuned LoRA model.
- If no GPU is available, it returns a fast professional travel assistant answer
  using the trip budget and destination context, without blocking the website.
"""

from functools import lru_cache
import os
from pathlib import Path
import re
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field


BASE_MODEL = "gplsi/Aitana-2B-S-tourism-base"
MODEL_DIR = Path("./travel-buddy-model")

app = FastAPI(title="Travel-Buddy AI API")


class ChatRequest(BaseModel):
    message: str = Field(..., examples=["Je vais au Canada, propose-moi des activites"])
    destination: str = Field(..., examples=["Canada"])
    totalBudget: float = Field(..., ge=0, examples=[8000])
    currency: str = Field(default="MAD", examples=["MAD"])
    numberOfMembers: int = Field(default=1, ge=1, examples=[4])
    durationDays: int = Field(default=1, ge=1, examples=[5])
    includeContext: bool = True


class ChatResponse(BaseModel):
    destination: str
    budgetPerPerson: float
    budgetPerPersonPerDay: float
    budgetLevel: str
    answer: str
    modelLoaded: bool = True
    modelPath: str | None = None


def compute_budget(total_budget: float, members: int, days: int) -> tuple[float, float, str]:
    budget_per_person = total_budget / max(1, members)
    budget_per_person_per_day = budget_per_person / max(1, days)

    if budget_per_person_per_day < 300:
        level = "economic"
    elif budget_per_person_per_day <= 800:
        level = "medium"
    else:
        level = "premium"

    return budget_per_person, budget_per_person_per_day, level


def public_budget_level(level: str) -> str:
    return {
        "economic": "economique",
        "medium": "moyen",
        "premium": "premium",
    }.get(level, level)


def find_adapter_dir() -> Path:
    direct_adapter = MODEL_DIR / "adapter_config.json"
    if direct_adapter.exists():
        return MODEL_DIR

    checkpoints = []
    for child in MODEL_DIR.glob("checkpoint-*"):
        if not child.is_dir():
            continue
        if not (child / "adapter_config.json").exists():
            continue
        match = re.search(r"checkpoint-(\d+)$", child.name)
        step = int(match.group(1)) if match else 0
        checkpoints.append((step, child))

    if not checkpoints:
        raise FileNotFoundError(
            "No adapter_config.json found in ./travel-buddy-model or checkpoint-* folders."
        )

    return sorted(checkpoints, key=lambda item: item[0])[-1][1]


def destination_guide(destination: str) -> dict[str, list[tuple[str, str, str]]]:
    key = destination.strip().lower()
    guides = {
        "ibiza": {
            "activities": [
                ("Dalt Vila", "Ibiza Town", "vieille ville, remparts, vues et photos; gratuit"),
                ("Cala Comte", "cote ouest", "plage connue pour le coucher de soleil"),
                ("Es Vedra", "sud-ouest", "point de vue naturel, tres beau en fin de journee"),
                ("Formentera", "depart port d'Ibiza", "excursion bateau premium ou demi-journee"),
                ("Hippy Market Punta Arabi", "Es Canar", "shopping local et ambiance boheme"),
                ("Ses Salines", "sud d'Ibiza", "plage, nature et restaurants de plage"),
            ],
            "restaurants": [
                ("La Bodega", "Ibiza Town", "tapas, bon choix pour un groupe"),
                ("S'Escalinata", "Dalt Vila", "simple, joli cadre, budget raisonnable"),
                ("Can Pilot", "Sant Rafael", "viandes grillees, experience locale"),
                ("Es Boldado", "Cala d'Hort", "vue vers Es Vedra, plutot premium"),
                ("Bar Costa", "Santa Gertrudis", "sandwichs et ambiance locale"),
            ],
        },
        "canada": {
            "activities": [
                ("Parc Stanley", "Vancouver", "balade, velo, vues mer et skyline"),
                ("Vieux-Quebec", "Quebec City", "quartier historique et rues photogeniques"),
                ("Chutes du Niagara", "Ontario", "site iconique avec options gratuites et payantes"),
                ("Banff National Park", "Alberta", "lacs, randonnees, paysages premium"),
                ("Mont Royal", "Montreal", "vue sur la ville, activite economique"),
            ],
            "restaurants": [
                ("St-Viateur Bagel", "Montreal", "bagels connus, economique"),
                ("La Banquise", "Montreal", "poutine, convivial"),
                ("Richmond Station", "Toronto", "cuisine moderne, budget moyen/premium"),
                ("Joe Beef", "Montreal", "premium, reservation conseillee"),
            ],
        },
        "palestine": {
            "activities": [
                ("Bethlehem Old City", "Bethleem", "balade culturelle, artisanat et patrimoine"),
                ("Afteem area", "Bethleem", "falafel, houmous et ambiance locale"),
                ("Banksy Walled Off Hotel area", "Bethleem", "art et histoire contemporaine"),
                ("Marche local", "Ramallah ou Bethleem", "cuisine, souvenirs et vie locale"),
                ("Jericho", "Cisjordanie", "site historique et paysages desertiques"),
            ],
            "restaurants": [
                ("Afteem", "Bethleem", "houmous et falafel, economique"),
                ("Fawda Cafe", "Bethleem", "cuisine locale moderne"),
                ("Zamn Cafe", "Ramallah", "cafe et plats locaux"),
                ("Orjuwan Lounge", "Ramallah", "plus confortable, budget moyen"),
            ],
        },
    }

    return guides.get(key, {
        "activities": [
            (f"Centre historique de {destination}", "centre-ville", "balade, photos et decouverte locale"),
            (f"Marche local de {destination}", "zone centrale", "cuisine locale et souvenirs"),
            (f"Point de vue principal de {destination}", "quartier panoramique", "coucher de soleil et photos"),
            (f"Musee ou site culturel de {destination}", "centre", "culture et histoire"),
            (f"Excursion autour de {destination}", "alentours", "option premium selon budget"),
        ],
        "restaurants": [
            ("Restaurant local traditionnel", "centre-ville", "plats locaux et prix raisonnables"),
            ("Cafe bien note", "quartier central", "petit-dejeuner ou pause"),
            ("Restaurant avec vue", "zone touristique", "option premium"),
            ("Street food locale", "marche ou centre", "economique et pratique"),
        ],
    })


def build_prompt(payload: ChatRequest, per_person: float, per_day: float, level: str) -> str:
    style_instruction = (
        "For this first answer, include destination and budget analysis before recommendations."
        if payload.includeContext
        else "Do not repeat destination or budget analysis. Answer directly to the user's latest request."
    )

    return f"""<s>[SYSTEM]
You are Travel-Buddy, a professional tourism assistant.
Reply in French. Adapt recommendations to the trip budget.
{style_instruction}
[/SYSTEM]

[TRIP_CONTEXT]
Destination: {payload.destination}
Total budget: {payload.totalBudget:.2f} {payload.currency}
Number of members: {payload.numberOfMembers}
Duration: {payload.durationDays} days
Budget per person: {per_person:.2f} {payload.currency}
Budget per person per day: {per_day:.2f} {payload.currency}
Budget level: {level}
[/TRIP_CONTEXT]

[USER]
{payload.message}
[/USER]

[ASSISTANT]
"""


def fallback_answer(payload: ChatRequest, per_person: float, per_day: float, level: str) -> str:
    label = public_budget_level(level)
    question = payload.message.lower()
    guide = destination_guide(payload.destination)

    wants_restaurants = any(word in question for word in ["restaur", "resto", "restau", "manger", "food", "diner", "dejeuner"])
    wants_plan = any(word in question for word in ["planning", "itineraire", "jour", "programme", "plan"])
    wants_budget = any(word in question for word in ["budget", "prix", "depense", "economique", "cher"])

    if wants_restaurants:
        title = "Restaurants recommandes"
        recommendations = "\n".join(
            f"- {name} ({area}) : {note}." for name, area, note in guide["restaurants"]
        )
        avoid = (
            "- Eviter les restaurants de plage tres touristiques sans verifier le menu.\n"
            "- Eviter de reserver tous les repas en premium: garde une marge pour transport et activites."
        )
        tips = "Reserve 1 ou 2 bons restaurants, puis garde le reste flexible avec cafes, tapas ou street food."
    elif wants_plan:
        title = "Planning propose"
        recommendations = "\n".join(
            f"- Jour {index + 1}: {name} ({area}) - {note}."
            for index, (name, area, note) in enumerate(guide["activities"][:5])
        )
        avoid = (
            "- Eviter de mettre trop d'activites eloignees le meme jour.\n"
            "- Eviter les grosses excursions le jour d'arrivee ou le dernier jour."
        )
        tips = "Garde les activites les plus cheres au milieu du voyage et laisse un jour plus leger."
    elif wants_budget:
        title = "Conseil budget"
        if level == "economic":
            recommendations = (
                "- Priorite aux plages, marches, points de vue et quartiers historiques.\n"
                "- Limite les activites payantes a une seule experience forte.\n"
                "- Utilise transport public, marche et repas simples."
            )
        elif level == "medium":
            recommendations = (
                "- Alterne une activite gratuite le matin et une activite payante l'apres-midi.\n"
                "- Garde 15% du budget pour imprevus.\n"
                "- Choisis restaurants locaux plutot que zones ultra touristiques."
            )
        else:
            recommendations = (
                "- Tu peux ajouter excursions, restaurants avec vue et visites guidees.\n"
                "- Garde quand meme un plafond par jour pour ne pas exploser le budget.\n"
                "- Compare les options premium avant reservation."
            )
        avoid = "- Eviter les reservations non remboursables avant validation du groupe."
        tips = "Je peux aussi te proposer une repartition budget: repas, transport, activites, extras."
    else:
        title = "Activites recommandees"
        recommendations = "\n".join(
            f"- {name} ({area}) : {note}." for name, area, note in guide["activities"]
        )
        avoid = (
            "- Eviter les activites trop eloignees les unes des autres le meme jour.\n"
            "- Eviter les options premium si elles ne plaisent pas a tout le groupe."
        )
        tips = "Demande-moi ensuite un planning jour par jour ou une selection restaurants."

    intro = ""
    if payload.includeContext:
        intro = (
            f"Destination :\n{payload.destination}\n\n"
            f"Analyse du budget :\n"
            f"Budget total: {payload.totalBudget:.0f} {payload.currency}. "
            f"Pour {payload.numberOfMembers} membre(s) sur {payload.durationDays} jour(s), "
            f"cela donne {per_person:.0f} {payload.currency} par personne, soit "
            f"{per_day:.0f} {payload.currency} par personne par jour. Niveau: {label}.\n\n"
        )

    return (
        f"{intro}{title} :\n{recommendations}\n\n"
        f"A eviter :\n{avoid}\n\n"
        f"Conseils :\n{tips}"
    )


@lru_cache(maxsize=1)
def load_model() -> tuple[Any, Any, Path]:
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    adapter_dir = find_adapter_dir()
    use_cuda = torch.cuda.is_available()
    force_cpu_model = os.getenv("TRAVEL_BUDDY_FORCE_CPU_MODEL") == "1"

    if not use_cuda and not force_cpu_model:
        raise RuntimeError("No CUDA GPU available; using fast assistant mode.")

    tokenizer = AutoTokenizer.from_pretrained(adapter_dir, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model_kwargs: dict[str, Any] = {
        "device_map": "auto" if use_cuda else None,
        "trust_remote_code": True,
    }

    if use_cuda:
        try:
            from transformers import BitsAndBytesConfig
            import torch as torch_module

            model_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch_module.float16,
                bnb_4bit_use_double_quant=True,
            )
        except Exception:
            model_kwargs["torch_dtype"] = torch.float16
    else:
        model_kwargs["torch_dtype"] = torch.float32

    base_model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, **model_kwargs)
    model = PeftModel.from_pretrained(base_model, adapter_dir)

    if not use_cuda:
        model = model.to("cpu")

    model.eval()
    return tokenizer, model, adapter_dir


def generate_text(prompt: str) -> tuple[str, Path]:
    import torch

    tokenizer, model, adapter_dir = load_model()
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=500,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.08,
            pad_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    return decoded.split("[ASSISTANT]")[-1].strip(), adapter_dir


def strip_repeated_context(answer: str) -> str:
    cleaned = re.sub(
        r"(?is)^\s*(📍\s*)?destination\s*:.*?(?=(✅|Activites|Activités|Restaurants|Planning|Conseil|A eviter|À éviter|Recommandations))",
        "",
        answer,
    )
    cleaned = re.sub(
        r"(?is)^\s*(💰\s*)?analyse du budget\s*:.*?(?=(✅|Activites|Activités|Restaurants|Planning|Conseil|A eviter|À éviter|Recommandations))",
        "",
        cleaned,
    )
    return cleaned.strip() or answer.strip()


def should_use_local_model() -> bool:
    return os.getenv("TRAVEL_BUDDY_USE_LOCAL_MODEL") == "1"


@app.get("/health")
def health():
    try:
        adapter_dir = find_adapter_dir()
        model_ready = True
        error = None
    except Exception as exc:
        adapter_dir = None
        model_ready = False
        error = str(exc)

    return {
        "status": "ok",
        "service": "travel-buddy-ai",
        "modelReady": model_ready,
        "modelPath": str(adapter_dir) if adapter_dir else None,
        "usesLocalModel": should_use_local_model(),
        "error": error,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    per_person, per_day, level = compute_budget(
        payload.totalBudget,
        payload.numberOfMembers,
        payload.durationDays,
    )
    prompt = build_prompt(payload, per_person, per_day, level)

    if not should_use_local_model():
        return ChatResponse(
            destination=payload.destination,
            budgetPerPerson=round(per_person, 2),
            budgetPerPersonPerDay=round(per_day, 2),
            budgetLevel=level,
            answer=fallback_answer(payload, per_person, per_day, level),
            modelLoaded=False,
            modelPath=None,
        )

    try:
        answer, adapter_dir = generate_text(prompt)
        if not payload.includeContext:
            answer = strip_repeated_context(answer)
        model_loaded = True
        model_path = str(adapter_dir)
    except Exception:
        answer = fallback_answer(payload, per_person, per_day, level)
        model_loaded = False
        model_path = None

    return ChatResponse(
        destination=payload.destination,
        budgetPerPerson=round(per_person, 2),
        budgetPerPersonPerDay=round(per_day, 2),
        budgetLevel=level,
        answer=answer,
        modelLoaded=model_loaded,
        modelPath=model_path,
    )
