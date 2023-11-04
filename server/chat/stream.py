from enum import Enum
from typing import AsyncIterable, List

import openai as oai
from pydantic.main import BaseModel

oai.api_base = "http://localhost:7777/v1"
oai.api_key = "sk-blah"

__all__ = ["stream_chat_message"]


class MessageRole(Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Message(BaseModel):
    role: MessageRole
    content: str


def format_prompt(messages: List[Message]) -> str:
    formatted = []
    for m in messages + [Message(role=MessageRole.assistant, content="")]:
        match m.role:
            case MessageRole.user:
                formatted.append(f"GPT4 Correct User: {m.content}")
            case MessageRole.assistant:
                formatted.append(f"GPT4 Correct Assistant: {m.content}")
            case MessageRole.system:
                formatted.append(f"System: {m.content}")
    return "\n".join(formatted)


messages: List[Message] = []


async def stream_chat_message(message: str) -> AsyncIterable[str]:
    messages.append(Message(role=MessageRole.user, content=message))
    prompt = format_prompt(messages)
    print(prompt)
    completion_resp = await oai.Completion.acreate(
        model="open_chat",
        stream=True,
        prompt=prompt,
        max_tokens=2000,
        stop=["<|end_of_turn|>"],
    )

    chunk: oai.Completion
    assistant_resp = ""
    async for chunk in completion_resp:  # type: ignore
        resp = chunk["choices"][0]["text"]
        yield resp
        assistant_resp += resp
    messages.append(Message(role=MessageRole.assistant, content=assistant_resp))
