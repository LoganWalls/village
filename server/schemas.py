from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    profile_id: int
    conversation_id: int
    message: str
