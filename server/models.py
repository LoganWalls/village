from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Profile(BaseModel):
    id: Optional[int] = Field(default=None)
    name: str


class ChatCoversation(BaseModel):
    id: Optional[int] = Field(default=None)
    name: Optional[str] = Field(default=None)
    profile_id: int


class ChatRole(str, Enum):
    user = "user"
    ai = "ai"
    system = "system"


class ChatMessage(BaseModel):
    id: Optional[int] = Field(default=None)
    timestamp: Optional[datetime] = Field(default=None)
    conversation_id: Optional[int] = Field(default=None)
    role: ChatRole
    content: str


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
