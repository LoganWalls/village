import base64
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


def uuid_slug() -> str:
    """
    Returns a randomly generated uuid v4, encoded as a url-safe slug string
    """
    return base64.urlsafe_b64encode(uuid.uuid4().bytes)[:-2].decode("utf-8")


class User(BaseModel):
    id: Optional[int] = Field(default=None)
    name: str
    session: str = Field(
        default_factory=uuid_slug,
        regex=r"[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]",
        min_length=22,
        max_length=22,
    )


class ChatStreamRequest(BaseModel):
    message: str


class ChatCoversation(BaseModel):
    id: Optional[int] = Field(default=None)
    name: Optional[str] = Field(default=None)
    user_id: int
    ai_profile: str


class ChatRole(str, Enum):
    user = "user"
    ai = "ai"
    system = "system"


class ChatMessage(BaseModel):
    id: Optional[int] = Field(default=None)
    role: ChatRole
    content: str
    timestamp: Optional[datetime] = Field(default=None)


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
