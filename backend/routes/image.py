import json
import os
from flask import Blueprint, request, jsonify
from services.grok import generate_image

image_bp = Blueprint("image", __name__)

_templates_path = os.path.join(os.path.dirname(__file__), "..", "data", "templates.json")
_video_templates_path = os.path.join(os.path.dirname(__file__), "..", "data", "video_templates.json")


@image_bp.route("/generate-image", methods=["POST"])
def generate():
    body = request.get_json(silent=True) or {}
    prompt = body.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400
    n = min(int(body.get("n", 1)), 4)
    try:
        urls = generate_image(prompt, n=n)
        return jsonify({"images": urls, "prompt": prompt})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@image_bp.route("/templates", methods=["GET"])
def templates():
    mode = request.args.get("mode", "image")
    path = _video_templates_path if mode == "video" else _templates_path
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
