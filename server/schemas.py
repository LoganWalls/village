from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    profile_id: int
    thread_id: int
    message: str
