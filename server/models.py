from datetime import datetime
from enum import Enum, EnumMeta
from typing import List, Optional

from sqlmodel import Column, Field, Relationship, SQLModel, func, TypeDecorator, Integer

class MagicEnum(TypeDecorator):
    """Backed by integers in the database, but uses the python enum values for client side"""
    impl = Integer
    def __init__(self, enumtype: EnumMeta, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._enumtype = enumtype
        self.members = list(enumtype)

    def process_bind_param(self, value, _):
        return self.members.index(value)

    def process_result_value(self, value: int, _):
        return self.members[value]


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversations: List["ChatConversation"] = Relationship(back_populates="user")


class ChatConversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="conversations")
    ai_profile: str
    messages: List["ChatMessage"] = Relationship(back_populates="conversation")


class ChatRole(str, Enum):
    user = "user"
    ai = "ai"
    system = "system"

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: Optional[datetime] = Field(default=None, sa_column_kwargs=dict(server_default=func.now()))
    role: ChatRole = Field(sa_column=Column(MagicEnum(ChatRole)))
    content: str
    conversation_id: int = Field(foreign_key="conversation.id")
    conversation: ChatConversation = Relationship(back_populates="messages")
