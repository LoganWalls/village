from pydantic import BaseModel


class NewThreadRequest(BaseModel):
    profile_id: int


class ChatStreamRequest(BaseModel):
    profile_id: int
    thread_id: int
    message: str
