from flask import Blueprint, request, jsonify
from services.openrouter import enhance_prompt

prompt_bp = Blueprint("prompt", __name__)


def _build_raw_image_prompt(data: dict) -> str:
    parts = []
    for key, suffix in [
        ("subject", ""), ("style", " style"), ("composition", " composition"),
        ("lighting", " lighting"), ("details", ""),
    ]:
        if data.get(key):
            parts.append(data[key] + suffix)
    return ", ".join(parts)


def _build_raw_video_prompt(data: dict) -> str:
    parts = []
    for key, suffix in [
        ("subject", ""), ("motion", " motion"), ("camera_movement", " camera movement"),
        ("style", " style"), ("duration", " duration"), ("environment", ""),
        ("lighting", " lighting"), ("details", ""),
    ]:
        if data.get(key):
            parts.append(data[key] + suffix)
    return ", ".join(parts)


@prompt_bp.route("/enhance-prompt", methods=["POST"])
def enhance():
    body = request.get_json(silent=True) or {}
    mode = body.get("mode", "image")  # "image" | "video"

    if mode == "video":
        raw = body.get("prompt") or _build_raw_video_prompt(body)
    else:
        raw = body.get("prompt") or _build_raw_image_prompt(body)

    if not raw.strip():
        return jsonify({"error": "prompt is required"}), 400
    try:
        enhanced = enhance_prompt(raw, mode=mode)
        return jsonify({"enhanced": enhanced, "original": raw, "mode": mode})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
