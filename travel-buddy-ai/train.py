"""
Fine-tune Travel-Buddy tourism chatbot with QLoRA.

Model:
  gplsi/Aitana-2B-S-tourism-base

Dataset:
  bitext/Bitext-travel-llm-chatbot-training-dataset

Output:
  ./travel-buddy-model

Designed for Google Colab or a local NVIDIA GPU machine.
"""

import os
import torch
from datasets import load_dataset
from peft import LoraConfig, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer


MODEL_NAME = "gplsi/Aitana-2B-S-tourism-base"
DATASET_NAME = "bitext/Bitext-travel-llm-chatbot-training-dataset"
OUTPUT_DIR = "./travel-buddy-model"


SYSTEM_PROMPT = """You are Travel-Buddy, a professional tourism assistant.
You help travelers plan trips, choose activities, respect their budget,
compare options, and avoid unsuitable recommendations.
Always answer clearly, politely, and with practical travel advice."""


def pick_column(example: dict, candidates: list[str], fallback: str = "") -> str:
    """Return the first non-empty value found in a dataset row."""
    for key in candidates:
        value = example.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return fallback


def format_example(example: dict) -> dict:
    """
    Convert Bitext rows into instruction tuning text.

    Bitext datasets can expose columns such as instruction, response,
    category, intent, or text depending on the dataset revision. This formatter
    is intentionally defensive so the script remains usable if column names
    differ slightly.
    """
    user_message = pick_column(
        example,
        ["instruction", "prompt", "input", "question", "user", "text"],
        fallback="Give me useful travel recommendations.",
    )
    assistant_answer = pick_column(
        example,
        ["response", "output", "answer", "assistant", "completion"],
        fallback="I can help you plan a trip with activities, budget tips, and local advice.",
    )

    text = (
        "<s>[SYSTEM]\n"
        f"{SYSTEM_PROMPT}\n"
        "[/SYSTEM]\n\n"
        "[USER]\n"
        f"{user_message}\n"
        "[/USER]\n\n"
        "[ASSISTANT]\n"
        f"{assistant_answer}\n"
        "[/ASSISTANT]</s>"
    )
    return {"text": text}


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA GPU not found. Use Google Colab GPU runtime or an NVIDIA GPU machine."
        )

    # 1. Download the dataset automatically from Hugging Face.
    dataset = load_dataset(DATASET_NAME)
    train_dataset = dataset["train"]

    # 2. Prepare supervised fine-tuning text.
    train_dataset = train_dataset.map(
        format_example,
        remove_columns=train_dataset.column_names,
        desc="Formatting dataset for SFT",
    )

    # 3. Configure BitsAndBytes 4-bit quantization for QLoRA.
    # NF4 is the recommended 4-bit data type for QLoRA training.
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # 4. Load tokenizer.
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # 5. Load base model in 4-bit.
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model.config.use_cache = False
    model = prepare_model_for_kbit_training(model)

    # 6. Configure LoRA adapters.
    # These target modules work for many LLaMA-like causal LM architectures.
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )

    # 7. Reasonable hyperparameters for a 2B model on Colab GPU.
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        fp16=True,
        bf16=False,
        gradient_checkpointing=True,
        max_grad_norm=0.3,
        report_to="none",
    )

    # 8. Supervised fine-tuning with TRL SFTTrainer.
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        dataset_text_field="text",
        max_seq_length=1024,
        packing=False,
        peft_config=peft_config,
        args=training_args,
    )

    trainer.train()

    # 9. Save LoRA adapter and tokenizer.
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print(f"Fine-tuned Travel-Buddy adapter saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
