import requests
from config import Config

IMAGE_SYSTEM_PROMPT = """You are an expert at writing image generation prompts for Grok's image API.
When given a description, enhance it into a detailed, vivid English prompt optimized for photorealistic or artistic image generation.
Output ONLY the enhanced prompt text — no explanations, no quotes, no labels."""

VIDEO_SYSTEM_PROMPT = """You are an expert at writing video generation prompts for AI video models (Sora, RunwayML, Pika, Kling).
When given a description, enhance it into a detailed, motion-rich English prompt.
Include: subject action, camera movement, lighting changes, visual style, atmosphere, and pacing.
Output ONLY the enhanced prompt text — no explanations, no quotes, no labels."""


def enhance_prompt(raw_prompt: str, mode: str = "image") -> str:
    system = VIDEO_SYSTEM_PROMPT if mode == "video" else IMAGE_SYSTEM_PROMPT

    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
    }
    payload = {
        "model": Config.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": raw_prompt},
        ],
        "max_tokens": 500,
    }
    resp = requests.post(
        f"{Config.OPENROUTER_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()
