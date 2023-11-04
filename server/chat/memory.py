from typing import List, Optional

from .schemas import ChatMessage


class ChatMemory:
    history: List[ChatMessage]

    def __init__(self, history: Optional[List[ChatMessage]] = None):
        self.history = history or []
