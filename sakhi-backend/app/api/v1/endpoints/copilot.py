import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
import threading

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Offline Model Setup
hf_pipeline = None
model_lock = threading.Lock()

def get_offline_pipeline():
    global hf_pipeline
    if hf_pipeline is None:
        with model_lock:
            if hf_pipeline is None:
                from transformers import pipeline
                print("Loading offline Hugging Face model...")
                # Using a small, efficient model for offline text generation
                hf_pipeline = pipeline(
                    "text-generation", 
                    model="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                    device_map="auto"
                )
    return hf_pipeline

@router.post("/chat", response_model=ChatResponse)
def copilot_chat(req: ChatRequest):
    hf_token = os.environ.get("HF_TOKEN")
    
    # OFFLINE MODE (No HF_TOKEN provided)
    if not hf_token:
        try:
            pipe = get_offline_pipeline()
            prompt = f"<|system|>\nYou are Sakhi AI, a helpful medical assistant for ASHA workers in India. Provide simple, clear, and actionable advice.\n<|user|>\n{req.message}\n<|assistant|>\n"
            
            outputs = pipe(prompt, max_new_tokens=150, do_sample=True, temperature=0.7, top_k=50, top_p=0.95)
            generated_text = outputs[0]["generated_text"]
            
            # Extract just the assistant reply
            reply = generated_text.split("<|assistant|>")[-1].strip()
            return ChatResponse(reply=reply)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Offline model failed: {str(e)}")
            
    # ONLINE MODE
    try:
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_token,
        )

        completion = client.chat.completions.create(
            model="moonshotai/Kimi-K2-Instruct-0905",
            messages=[
                {
                    "role": "system",
                    "content": "You are Sakhi AI, a helpful medical assistant for ASHA workers in India. Provide simple, clear, and actionable advice."
                },
                {
                    "role": "user",
                    "content": req.message
                }
            ],
            max_tokens=150,
        )

        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
