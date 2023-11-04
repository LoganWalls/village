from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    message: str


class ChatConfig(BaseModel):
    user_prefix: str = ""
    ai_prefix: str = ""
    system_prefix: str = ""
    suffix: str = ""
