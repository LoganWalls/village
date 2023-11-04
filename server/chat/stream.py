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


def format_prompt(
    messages: List[Message],
    user_prefix: str = "GPT4 Correct User: ",
    assistant_prefix: str = "GPT4 Correct Assistant: ",
    system_prefix: str = "",
    suffix: str = "<|end_of_turn|>",
) -> str:
    formatted = []
    for m in messages + []:
        prefix: str
        match m.role:
            case MessageRole.user:
                prefix = user_prefix
            case MessageRole.assistant:
                prefix = assistant_prefix
            case MessageRole.system:
                prefix = system_prefix
        formatted.append(f"{prefix}{m.content}{suffix}")
    formatted.append(assistant_prefix)
    return "\n".join(formatted)


# TODO: manage history per session
messages: List[Message] = [
    Message(
        role=MessageRole.system,
        content="You are a helpful assistant named Zephyr. You are capable, friendly, and not afraid to speak casually. You avoid long-winded answers, but provide details when the situation demands it. You always answer in English unless asked otherwise, and you always write code as markdown.",
    )
]


async def stream_chat_message(message: str) -> AsyncIterable[str]:
    messages.append(Message(role=MessageRole.user, content=message))
    prompt = format_prompt(messages)
    print(prompt)
    completion_resp = await oai.Completion.acreate(
        model="open_chat",
        stream=True,
        prompt=prompt,
        max_tokens=2000,
        stop=["<|end_of_turn|>", "GPT4 Correct User: ", "GPT4 Correct Assistnant: "],
    )

    chunk: oai.Completion
    assistant_resp = ""
    async for chunk in completion_resp:  # type: ignore
        resp = chunk["choices"][0]["text"]
        yield resp
        assistant_resp += resp
    messages.append(Message(role=MessageRole.assistant, content=assistant_resp))
