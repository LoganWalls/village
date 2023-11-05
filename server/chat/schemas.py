from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


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
