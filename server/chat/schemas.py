from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    message: str


class ChatSession(BaseModel):
    id: int
    name: Optional[str]
    user_id: int
    ai_profile: str


class ChatMessageRole(Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    id: int
    role: ChatMessageRole
    content: str
    timestamp: datetime


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
