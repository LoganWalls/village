from enum import Enum

from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    message: str


class ChatMessageRole(Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    role: ChatMessageRole
    content: str


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
