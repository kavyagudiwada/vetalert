"""Google Sign-In (OAuth 2.0 ID token) verification for Vetalert.

Uses Google's publicly served JWKS to verify the RS256 signature of the
ID token issued by Google Identity Services. No client secret required.
"""

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import get_settings

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}

_certs_cache: dict[str, dict] | None = None


async def _get_certs() -> dict[str, dict]:
    global _certs_cache
    if _certs_cache is None:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(GOOGLE_CERTS_URL)
            response.raise_for_status()
        keys = response.json().get("keys", [])
        _certs_cache = {key["kid"]: key for key in keys if "kid" in key}
    return _certs_cache


async def verify_google_id_token(credential: str) -> dict:
    """Verify a Google ID token and return its verified claims."""
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured. Set GOOGLE_CLIENT_ID.",
        )

    try:
        headers = jwt.get_unverified_headers(credential)
        key = (await _get_certs()).get(headers.get("kid"))
        if key is None:
            raise JWTError("Unknown token key id")
        claims = jwt.decode(
            credential,
            key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            issuer=list(GOOGLE_ISSUERS),
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from exc

    email = claims.get("email")
    if not email or not claims.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified",
        )

    return claims