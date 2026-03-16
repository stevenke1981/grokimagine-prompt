"""
Prompt history — per-user JSON file storage.
Each user's records live in data/prompts/<user_sub>.json
"""

import json
import os
import time
import uuid
from flask import Blueprint, request, jsonify
import jwt as pyjwt
from config import Config

history_bp = Blueprint("history", __name__)

_PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "prompts")


def _get_user_sub() -> str | None:
    token = request.cookies.get("auth_token")
    if not token:
        return None
    try:
        payload = pyjwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub") or payload.get("email")
    except pyjwt.InvalidTokenError:
        return None


def _user_file(sub: str) -> str:
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in sub)
    return os.path.join(_PROMPTS_DIR, f"{safe}.json")


def _load_records(sub: str) -> list:
    path = _user_file(sub)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_records(sub: str, records: list):
    path = _user_file(sub)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


@history_bp.route("/prompts", methods=["GET"])
def list_prompts():
    sub = _get_user_sub()
    if not sub:
        return jsonify({"error": "Not authenticated"}), 401

    records = _load_records(sub)
    # Newest first
    records.sort(key=lambda r: r.get("created_at", 0), reverse=True)
    return jsonify(records)


@history_bp.route("/prompts", methods=["POST"])
def save_prompt():
    sub = _get_user_sub()
    if not sub:
        return jsonify({"error": "Not authenticated"}), 401

    body = request.get_json(silent=True) or {}
    record = {
        "id": str(uuid.uuid4()),
        "created_at": int(time.time()),
        "type": body.get("type", "image"),           # "image" | "video"
        "form_data": body.get("form_data", {}),
        "raw_prompt": body.get("raw_prompt", ""),
        "enhanced_prompt": body.get("enhanced_prompt", ""),
        "images": body.get("images", []),             # list of URLs
        "video_settings": body.get("video_settings", {}),
    }

    records = _load_records(sub)
    records.append(record)

    # Keep last 200 records
    if len(records) > 200:
        records = records[-200:]

    _save_records(sub, records)
    return jsonify(record), 201


@history_bp.route("/prompts/<record_id>", methods=["DELETE"])
def delete_prompt(record_id: str):
    sub = _get_user_sub()
    if not sub:
        return jsonify({"error": "Not authenticated"}), 401

    records = _load_records(sub)
    records = [r for r in records if r.get("id") != record_id]
    _save_records(sub, records)
    return jsonify({"ok": True})


@history_bp.route("/prompts/<record_id>", methods=["PATCH"])
def update_prompt(record_id: str):
    """Update images list (called after image generation)."""
    sub = _get_user_sub()
    if not sub:
        return jsonify({"error": "Not authenticated"}), 401

    body = request.get_json(silent=True) or {}
    records = _load_records(sub)
    for r in records:
        if r.get("id") == record_id:
            if "images" in body:
                r["images"] = body["images"]
            break
    _save_records(sub, records)
    return jsonify({"ok": True})
