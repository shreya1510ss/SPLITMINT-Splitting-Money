"""Authentication utilities for SplitMint backend.

This module provides:
- Secure password hashing/verification using bcrypt (passlib).
- JWT creation and decoding.

Both hashing and verification truncate the password to the maximum 72 bytes that bcrypt can handle. The truncation works on the UTF‑8 byte representation to avoid breaking multibyte characters.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from passlib.context import CryptContext

# ---------------------------------------------------------------------------
# Configuration – read from environment (fallback to sensible defaults)
# ---------------------------------------------------------------------------
SECRET_KEY: str = os.getenv("SECRET_KEY", "splitmint_super_secret_dev_key")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
# Token expiry for development – 8 hours (can be overridden per call)
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# ---------------------------------------------------------------------------
# Password handling – bcrypt via passlib
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _truncate_to_72_bytes(value: str) -> str:
    """Truncate a string so its UTF‑8 byte length does not exceed 72.

    bcrypt internally works on raw bytes and limits the input to 72 bytes.
    This helper encodes to UTF‑8, slices the first 72 bytes, and decodes back
    (ignoring any incomplete multibyte sequence). The result is safe to pass
    to ``pwd_context.hash`` or ``pwd_context.verify``.
    """
    # Encode, slice, then decode ignoring errors (drops a trailing partial char)
    return value.encode("utf-8")[:72].decode("utf-8", "ignore")

def hash_password(password: str) -> str:
    """Return a bcrypt hash of ``password``.

    The password is truncated to 72 bytes before hashing to satisfy bcrypt's
    limitation.
    """
    safe_password = _truncate_to_72_bytes(password)
    return pwd_context.hash(safe_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify ``plain_password`` against ``hashed_password``.

    The plain password is truncated in the same way as during hashing.
    """
    safe_password = _truncate_to_72_bytes(plain_password)
    return pwd_context.verify(safe_password, hashed_password)

# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    ``data`` should contain at least a ``sub`` (subject) field – typically the
    user ID. ``expires_delta`` can be supplied to customise the lifetime; if
    omitted the default development expiry (8 h) is used.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decode a JWT token and return its payload.

    Returns ``None`` if the token is expired or otherwise invalid.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
