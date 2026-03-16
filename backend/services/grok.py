import requests
from config import Config


def generate_image(prompt: str, n: int = 1) -> list[str]:
    """Call Grok image API and return a list of image URLs."""
    headers = {
        "Authorization": f"Bearer {Config.XAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": Config.GROK_IMAGE_MODEL,
        "prompt": prompt,
        "n": n,
    }
    resp = requests.post(
        f"{Config.XAI_BASE_URL}/images/generations",
        headers=headers,
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    return [item["url"] for item in data["data"]]
