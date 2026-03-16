import jwt
import time
import base64
import json as _json
import requests as http_requests
from flask import Blueprint, redirect, request, jsonify, make_response
from authlib.integrations.flask_client import OAuth
from config import Config

auth_bp = Blueprint("auth", __name__)
oauth = OAuth()

# ── Constants ──────────────────────────────────────────────────────────────
OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
OPENAI_TOKEN_URL = "https://auth.openai.com/oauth/token"
JWT_REFRESH_THRESHOLD = 300  # refresh JWT if < 5 min remaining


def init_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    oauth.register(
        name="github",
        client_id=Config.GITHUB_CLIENT_ID,
        client_secret=Config.GITHUB_CLIENT_SECRET,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )


# ── JWT helpers ────────────────────────────────────────────────────────────

def _make_jwt(user: dict, provider: str) -> str:
    payload = {
        "sub": str(user.get("sub") or user.get("id") or ""),
        "email": user.get("email", ""),
        "name": user.get("name") or user.get("login") or "",
        "avatar": user.get("picture") or user.get("avatar_url") or "",
        "provider": provider,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,  # 1h; refresh_token extends session
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")


def _make_jwt_payload(user: dict, provider: str) -> dict:
    return {
        "sub": str(user.get("sub") or user.get("id") or ""),
        "email": user.get("email", ""),
        "name": user.get("name") or user.get("login") or "",
        "avatar": user.get("picture") or user.get("avatar_url") or "",
        "provider": provider,
    }


def _set_auth_cookie(response, token: str):
    response.set_cookie(
        "auth_token", token, httponly=True, samesite="Lax",
        max_age=86400 * 30, secure=False,
    )


def _set_refresh_cookie(response, refresh_token: str, provider: str):
    """Store refresh_token + provider in separate httpOnly cookie."""
    payload = base64.b64encode(
        _json.dumps({"rt": refresh_token, "provider": provider}).encode()
    ).decode()
    response.set_cookie(
        "refresh_data", payload, httponly=True, samesite="Lax",
        max_age=86400 * 30, secure=False,
    )


def _clear_cookies(response):
    response.delete_cookie("auth_token")
    response.delete_cookie("refresh_data")


def _load_refresh_data() -> dict | None:
    raw = request.cookies.get("refresh_data")
    if not raw:
        return None
    try:
        return _json.loads(base64.b64decode(raw).decode())
    except Exception:
        return None


# ── Server-side OAuth (fallback) ───────────────────────────────────────────

@auth_bp.route("/google")
def google_login():
    redirect_uri = request.host_url.rstrip("/") + "/api/auth/callback/google"
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.route("/callback/google")
def google_callback():
    token = oauth.google.authorize_access_token()
    user = token.get("userinfo") or oauth.google.userinfo()
    refresh_token = token.get("refresh_token", "")
    jwt_token = _make_jwt(user, "google")
    resp = make_response(redirect(Config.FRONTEND_URL))
    _set_auth_cookie(resp, jwt_token)
    if refresh_token:
        _set_refresh_cookie(resp, refresh_token, "google")
    return resp


@auth_bp.route("/github")
def github_login():
    redirect_uri = request.host_url.rstrip("/") + "/api/auth/callback/github"
    return oauth.github.authorize_redirect(redirect_uri)


@auth_bp.route("/callback/github")
def github_callback():
    oauth.github.authorize_access_token()
    user = oauth.github.get("user").json()
    if not user.get("email"):
        emails = oauth.github.get("user/emails").json()
        primary = next((e for e in emails if e.get("primary")), None)
        user["email"] = primary["email"] if primary else ""
    jwt_token = _make_jwt(user, "github")
    resp = make_response(redirect(Config.FRONTEND_URL))
    _set_auth_cookie(resp, jwt_token)
    return resp


# ── /me with auto-refresh ──────────────────────────────────────────────────

@auth_bp.route("/me")
def me():
    token = request.cookies.get("auth_token")
    if not token:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        # Try refresh
        result = _try_refresh()
        if result is None:
            return jsonify({"error": "Session expired, please log in again"}), 401
        new_jwt, new_rt, provider, user_payload = result
        resp = make_response(jsonify(user_payload))
        _set_auth_cookie(resp, new_jwt)
        if new_rt:
            _set_refresh_cookie(resp, new_rt, provider)
        return resp
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    # Proactive refresh: reissue JWT + refresh_token if < threshold
    now = int(time.time())
    if payload.get("exp", 0) - now < JWT_REFRESH_THRESHOLD:
        result = _try_refresh()
        if result:
            new_jwt, new_rt, provider, user_payload = result
            resp = make_response(jsonify(user_payload))
            _set_auth_cookie(resp, new_jwt)
            if new_rt:
                _set_refresh_cookie(resp, new_rt, provider)
            return resp

    return jsonify(payload)


def _try_refresh() -> tuple | None:
    """Attempt token refresh. Returns (new_jwt, new_rt, provider, user_payload) or None."""
    data = _load_refresh_data()
    if not data:
        return None

    refresh_token = data.get("rt")
    provider = data.get("provider")

    if not refresh_token or not provider:
        return None

    try:
        if provider == "google":
            return _refresh_google(refresh_token)
        elif provider == "chatgpt":
            return _refresh_openai(refresh_token)
        # GitHub access tokens don't expire; no refresh needed
    except Exception:
        return None

    return None


def _refresh_google(refresh_token: str) -> tuple:
    r = http_requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": Config.GOOGLE_CLIENT_ID,
            "client_secret": Config.GOOGLE_CLIENT_SECRET,
        },
        timeout=15,
    )
    r.raise_for_status()
    tokens = r.json()
    # Google may not return a new refresh_token on refresh
    new_rt = tokens.get("refresh_token", refresh_token)

    userinfo = http_requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        timeout=10,
    ).json()

    new_jwt = _make_jwt(userinfo, "google")
    user_payload = _make_jwt_payload(userinfo, "google")
    return new_jwt, new_rt, "google", user_payload


def _refresh_openai(refresh_token: str) -> tuple:
    r = http_requests.post(
        OPENAI_TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": OPENAI_CLIENT_ID,
        },
        timeout=15,
    )
    r.raise_for_status()
    tokens = r.json()
    new_rt = tokens.get("refresh_token", refresh_token)

    # Decode id_token to get user info
    user = _decode_jwt_payload(tokens.get("id_token", "")) or {}
    # Extract chatgpt_account_id from access_token claims
    access_claims = _decode_jwt_payload(tokens.get("access_token", "")) or {}
    auth_claims = access_claims.get("https://api.openai.com/auth", {})
    user.setdefault("sub", auth_claims.get("chatgpt_account_id", ""))

    new_jwt = _make_jwt(user, "chatgpt")
    user_payload = _make_jwt_payload(user, "chatgpt")
    return new_jwt, new_rt, "chatgpt", user_payload


def _decode_jwt_payload(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        padded = parts[1] + "=" * (-len(parts[1]) % 4)
        return _json.loads(base64.urlsafe_b64decode(padded).decode())
    except Exception:
        return None


# ── Logout ──────────────────────────────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"ok": True}))
    _clear_cookies(resp)
    return resp


# ── PKCE browser-initiated exchange ──────────────────────────────────────────

@auth_bp.route("/exchange", methods=["POST"])
def exchange():
    body = request.get_json(silent=True) or {}
    provider = body.get("provider", "").lower()
    code = body.get("code", "").strip()
    redirect_uri = body.get("redirect_uri", "").strip()
    code_verifier = body.get("code_verifier")

    if not provider or not code or not redirect_uri:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        if provider == "google":
            user, refresh_token = _exchange_google(code, redirect_uri, code_verifier)
        elif provider == "github":
            user, refresh_token = _exchange_github(code, redirect_uri)
        elif provider == "chatgpt":
            user, refresh_token = _exchange_openai(code, redirect_uri, code_verifier)
        else:
            return jsonify({"error": f"Unsupported provider: {provider}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    jwt_token = _make_jwt(user, provider)
    user_payload = _make_jwt_payload(user, provider)
    resp = make_response(jsonify({"ok": True, "user": user_payload}))
    _set_auth_cookie(resp, jwt_token)
    if refresh_token:
        _set_refresh_cookie(resp, refresh_token, provider)
    return resp


def _exchange_google(code: str, redirect_uri: str, code_verifier: str | None) -> tuple:
    token_data = {
        "code": code,
        "client_id": Config.GOOGLE_CLIENT_ID,
        "client_secret": Config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    r = http_requests.post("https://oauth2.googleapis.com/token", data=token_data, timeout=15)
    r.raise_for_status()
    tokens = r.json()
    refresh_token = tokens.get("refresh_token", "")

    user = _decode_jwt_payload(tokens.get("id_token", ""))
    if not user:
        user = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            timeout=10,
        ).json()

    return user, refresh_token


def _exchange_github(code: str, redirect_uri: str) -> tuple:
    r = http_requests.post(
        "https://github.com/login/oauth/access_token",
        json={
            "client_id": Config.GITHUB_CLIENT_ID,
            "client_secret": Config.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": redirect_uri,
        },
        headers={"Accept": "application/json"},
        timeout=15,
    )
    r.raise_for_status()
    access_token = r.json().get("access_token")
    if not access_token:
        raise ValueError(r.json().get("error_description", "No access_token"))

    gh_headers = {"Authorization": f"Bearer {access_token}"}
    user = http_requests.get("https://api.github.com/user", headers=gh_headers, timeout=10).json()
    if not user.get("email"):
        emails = http_requests.get(
            "https://api.github.com/user/emails", headers=gh_headers, timeout=10
        ).json()
        primary = next((e for e in emails if e.get("primary")), None)
        user["email"] = primary["email"] if primary else ""

    # GitHub access tokens don't expire; no refresh_token
    return user, ""


def _exchange_openai(code: str, redirect_uri: str, code_verifier: str) -> tuple:
    """Exchange ChatGPT OAuth code for tokens (pure PKCE, no client_secret)."""
    r = http_requests.post(
        OPENAI_TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "authorization_code",
            "client_id": OPENAI_CLIENT_ID,
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
        },
        timeout=15,
    )
    r.raise_for_status()
    tokens = r.json()

    if not tokens.get("access_token"):
        raise ValueError("No access_token in OpenAI response")

    refresh_token = tokens.get("refresh_token", "")

    # User info from id_token
    user = _decode_jwt_payload(tokens.get("id_token", "")) or {}
    # Account ID from access_token
    access_claims = _decode_jwt_payload(tokens.get("access_token", "")) or {}
    auth_claims = access_claims.get("https://api.openai.com/auth", {})
    account_id = auth_claims.get("chatgpt_account_id", "")
    if account_id:
        user["sub"] = account_id

    return user, refresh_token
