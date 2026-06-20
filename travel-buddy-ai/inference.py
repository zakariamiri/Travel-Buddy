"""
Terminal chat with the fine-tuned Travel-Buddy model.

Run:
  python inference.py
"""

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig


BASE_MODEL = "gplsi/Aitana-2B-S-tourism-base"
ADAPTER_DIR = "./travel-buddy-model"


def classify_budget(total_budget: float, members: int, days: int) -> tuple[float, str]:
    """Compute budget per person per day and return a travel budget class."""
    members = max(1, members)
    days = max(1, days)
    per_person_per_day = total_budget / members / days

    if per_person_per_day < 300:
        level = "economic"
    elif per_person_per_day <= 800:
        level = "medium"
    else:
        level = "premium"

    return per_person_per_day, level


def build_prompt(
    message: str,
    destination: str,
    total_budget: float,
    currency: str,
    members: int,
    days: int,
) -> str:
    """Build a prompt that injects Travel-Buddy dashboard budget context."""
    budget_per_day, budget_level = classify_budget(total_budget, members, days)

    return f"""<s>[SYSTEM]
You are Travel-Buddy, a professional tourism assistant.
Use the trip budget from the Travel-Buddy dashboard to adapt recommendations.
If the budget is economic, suggest free or low-cost activities.
If the budget is medium, suggest a balanced mix of free and paid activities.
If the budget is premium, include premium experiences while staying practical.
Answer using this exact structure:
Destination:
Budget analysis:
Adapted recommendations:
Avoid:
Tips:
[/SYSTEM]

[TRIP_CONTEXT]
Destination: {destination}
Total budget: {total_budget:.2f} {currency}
Members: {members}
Duration: {days} days
Budget per person per day: {budget_per_day:.2f} {currency}
Budget level: {budget_level}
[/TRIP_CONTEXT]

[USER]
{message}
[/USER]

[ASSISTANT]
"""


def load_model():
    """Load the base model in 4-bit and attach the LoRA adapter."""
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
    model.eval()
    return tokenizer, model


def generate_answer(tokenizer, model, prompt: str) -> str:
    """Generate a model answer from a prompt."""
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=450,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.08,
            pad_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    return decoded.split("[ASSISTANT]")[-1].strip()


def main() -> None:
    tokenizer, model = load_model()

    print("Travel-Buddy AI ready. Type 'exit' to quit.")
    destination = input("Destination: ").strip() or "Morocco"
    total_budget = float(input("Total budget: ").strip() or "5000")
    currency = input("Currency: ").strip() or "MAD"
    members = int(input("Number of members: ").strip() or "1")
    days = int(input("Duration days: ").strip() or "1")

    while True:
        message = input("\nYou: ").strip()
        if message.lower() in {"exit", "quit"}:
            break

        prompt = build_prompt(message, destination, total_budget, currency, members, days)
        answer = generate_answer(tokenizer, model, prompt)
        print(f"\nTravel-Buddy:\n{answer}")


if __name__ == "__main__":
    main()
