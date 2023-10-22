from pydantic import BaseModel


class ChatStreamRequest(BaseModel):
    message: str
