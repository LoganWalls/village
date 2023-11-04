from pathlib import Path
from typing import Optional

from pydantic import BaseModel

from ..chat.schemas import ChatConfig


class AIProfile(BaseModel):
    name: str
    weights_path: Path
    chat_config: Optional[ChatConfig]
