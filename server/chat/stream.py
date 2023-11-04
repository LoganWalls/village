from pathlib import Path
from typing import AsyncIterable, List

import openai as oai

from server.core.schemas import AIProfile

from .schemas import ChatConfig, ChatMessage, ChatMessageRole

__all__ = ["stream_chat_message"]


def format_prompt(messages: List[ChatMessage], config: ChatConfig) -> str:
    formatted = []
    for m in messages + []:
        prefix: str = ""
        match m.role:
            case ChatMessageRole.user:
                prefix = config.user_prefix
            case ChatMessageRole.assistant:
                prefix = config.ai_prefix
            case ChatMessageRole.system:
                prefix = config.system_prefix
        formatted.append(f"{prefix}{m.content}{config.suffix}")
    formatted.append(config.ai_prefix)
    return "\n".join(formatted)


profile = AIProfile(
    name="OChat",
    weights_path=Path("~/Models/openchat_3.5.Q5_K_M.gguf").expanduser(),
    chat_config=ChatConfig(
        user_prefix="GPT4 Correct User: ",
        ai_prefix="GPT4 Correct Assistant: ",
        system_prefix="",
        suffix="<|end_of_turn|>",
    ),
)
messages: List[ChatMessage] = [
    ChatMessage(
        role=ChatMessageRole.system,
        content="You are a helpful assistant named Zephyr."
        " You are capable, friendly, and not afraid to speak casually."
        " You avoid long-winded answers, but provide details when the"
        " situation demands it. You always answer in English unless"
        " asked otherwise, and you always write code as markdown.",
    )
]


async def stream_chat_message(message: str) -> AsyncIterable[str]:
    config = profile.chat_config
    if config is None:
        return

    messages.append(ChatMessage(role=ChatMessageRole.user, content=message))
    prompt = format_prompt(messages, config)
    completion_resp = await oai.Completion.acreate(
        model=profile.name,
        stream=True,
        prompt=prompt,
        max_tokens=2000,
        stop=[config.suffix, config.user_prefix, config.ai_prefix],
    )

    chunk: oai.Completion
    assistant_resp = ""
    async for chunk in completion_resp:  # type: ignore
        resp = chunk["choices"][0]["text"]
        yield resp
        assistant_resp += resp
    messages.append(ChatMessage(role=ChatMessageRole.assistant, content=assistant_resp))
