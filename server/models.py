from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Profile(BaseModel):
    id: int
    name: str


class ChatThread(BaseModel):
    id: int
    timestamp: datetime
    name: str = Field(default="New thread")
    profile_id: int


class ChatRole(str, Enum):
    user = "user"
    ai = "ai"
    system = "system"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str


class SavedChatMessage(ChatMessage):
    id: int
    timestamp: datetime
    thread_id: int


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
