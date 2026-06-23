# Travel-Buddy AI

Fine-tuning QLoRA pour un chatbot touristique Travel-Buddy.

Le chatbot utilise:

- Modele Hugging Face: `gplsi/Aitana-2B-S-tourism-base`
- Dataset Hugging Face: `bitext/Bitext-travel-llm-chatbot-training-dataset`
- Transformers
- PEFT
- TRL
- BitsAndBytes
- QLoRA 4-bit
- FastAPI

Structure:

```txt
travel-buddy-ai/
├── dataset/
├── train.py
├── inference.py
├── api.py
├── requirements.txt
├── README.md
└── travel-buddy-model/
```

## Installation

Dans Google Colab:

```bash
!git clone <your-repo-url>
%cd Travel-Buddy/travel-buddy-ai
!pip install -r requirements.txt
```

En local:

```bash
cd travel-buddy-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Sur Linux / Colab:

```bash
cd travel-buddy-ai
pip install -r requirements.txt
```

## Entrainement

```bash
python train.py
```

Le script:

1. Telecharge automatiquement le dataset Bitext depuis Hugging Face.
2. Charge `gplsi/Aitana-2B-S-tourism-base`.
3. Charge le modele en 4 bits avec BitsAndBytes.
4. Configure QLoRA avec PEFT.
5. Formate le dataset pour le supervised fine-tuning.
6. Lance `SFTTrainer`.
7. Sauvegarde l'adapter LoRA et le tokenizer dans:

```txt
./travel-buddy-model
```

## Inference terminal

```bash
python inference.py
```

Le script demande:

- destination
- budget total
- devise
- nombre de membres
- duree du voyage

Puis il discute avec le modele en adaptant les recommandations au budget.

## API FastAPI

### Demarrage facile Windows

Depuis PowerShell:

```powershell
cd C:\Users\user\Travel-Buddy\travel-buddy-ai
.\start-ai.ps1
```

Ou depuis la racine du projet Travel-Buddy:

```powershell
cd C:\Users\user\Travel-Buddy
npm run ai
```

Le script cree automatiquement `.venv`, installe les dependances API, puis lance:

```powershell
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

L'API charge automatiquement le dernier checkpoint disponible dans:

```txt
travel-buddy-model/checkpoint-*
```

Par exemple, si `checkpoint-600` existe, il sera utilise.

Demarrer l'API:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

Tester:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Je vais au Canada, propose-moi des activites",
    "destination": "Canada",
    "totalBudget": 8000,
    "currency": "MAD",
    "numberOfMembers": 4,
    "durationDays": 5
  }'
```

Calcul budget:

```txt
8000 MAD / 4 membres / 5 jours = 400 MAD par personne par jour
```

Regles:

- `< 300 MAD` par personne par jour: recommandations economiques
- `300 a 800 MAD`: recommandations moyennes
- `> 800 MAD`: recommandations premium

Format demande au modele:

```txt
📍 Destination :
💰 Analyse du budget :
✅ Recommandations adaptées :
⚠️ À éviter :
💡 Conseils :
```

## Exemple d'integration avec Travel-Buddy Next.js

Exemple route Next.js `app/api/travel-ai/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: body.message,
      destination: body.destination,
      totalBudget: body.budget_total,
      currency: body.currency || "MAD",
      numberOfMembers: body.membersCount,
      durationDays: body.durationDays,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

Exemple appel depuis une page Travel-Buddy:

```ts
const response = await fetch("/api/travel-ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Propose-moi des activites pour ce voyage",
    destination: trip.destination,
    budget_total: trip.budget_total,
    currency: "MAD",
    membersCount: trip.membersCount,
    durationDays,
  }),
});

const ai = await response.json();
console.log(ai.answer);
```

## Exemple d'integration backend Node.js / Express

```js
app.post("/api/trips/:id/ai-chat", requireAuth, async (req, res) => {
  const trip = await tripsService.getTripById(req.params.id, req.user.id);

  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date || trip.start_date);
  const durationDays = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
  );

  const aiResponse = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: req.body.message,
      destination: trip.destination,
      totalBudget: trip.budget_total,
      currency: "MAD",
      numberOfMembers: trip.membersCount,
      durationDays,
    }),
  });

  const data = await aiResponse.json();
  res.status(aiResponse.status).json(data);
});
```

## Roles des librairies

### Transformers

Transformers charge le tokenizer et le modele de base Hugging Face. Il fournit aussi la generation de texte avec `model.generate()`.

### PEFT

PEFT signifie Parameter-Efficient Fine-Tuning. Au lieu de modifier tous les poids du modele, on entraine de petits adapters LoRA. Cela reduit fortement la memoire GPU necessaire.

### QLoRA

QLoRA combine quantization 4-bit et LoRA. Le modele de base reste charge en 4 bits, puis on entraine seulement les adapters LoRA. C'est ideal pour fine-tuner un modele de plusieurs milliards de parametres sur Colab.

### BitsAndBytes

BitsAndBytes permet de charger le modele en 4-bit avec `BitsAndBytesConfig`. Il fournit aussi des optimiseurs efficaces comme `paged_adamw_8bit`.

### SFTTrainer

`SFTTrainer` de TRL simplifie le supervised fine-tuning. Il prend un dataset texte, le tokenizer, le modele, les hyperparametres, et lance l'entrainement instruction-response.

## Notes importantes

- Utilise un runtime GPU dans Colab.
- Si Hugging Face demande une authentification pour le modele, execute:

```bash
huggingface-cli login
```

- Le dossier `travel-buddy-model/` contient l'adapter LoRA, pas forcement un modele complet merge.
- Pour production, il est preferable de lancer FastAPI sur une machine GPU separee.
