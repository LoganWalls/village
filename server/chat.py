from typing import AsyncIterable, List

import openai as oai
from aiosqlite import Connection

from .database import insert_chat_message
from .models import ChatConfig, ChatMessage, ChatRole, ChatThread, SavedChatMessage

__all__ = ["stream_model_response"]


def format_prompt(messages: List[ChatMessage], config: ChatConfig) -> str:
    formatted = []
    for m in messages + []:
        prefix: str = ""
        match m.role:
            case ChatRole.user:
                prefix = config.user_prefix
            case ChatRole.ai:
                prefix = config.ai_prefix
            case ChatRole.system:
                prefix = config.system_prefix
        formatted.append(f"{prefix}{m.content}{config.suffix}")
    formatted.append(config.ai_prefix)
    return "\n".join(formatted)


chat_config = ChatConfig(
    user_prefix="<|im_start|>\nuser",
    ai_prefix="<|im_start|>\nassistant",
    system_prefix="<|im_start|>\nsystem",
    suffix="<|im_end|>",
)


async def stream_model_response(
    db: Connection,
    thread: ChatThread,
    history: list[SavedChatMessage],
) -> AsyncIterable[str]:
    system_message = ChatMessage(
        role=ChatRole.system,
        content="You are a helpful assistant named Zephyr."
        " You are capable, friendly, and not afraid to speak casually."
        " You avoid long-winded answers, but provide details when the"
        " situation demands it. You always answer in English unless"
        " asked otherwise, and you always write code as markdown.",
    )

    prompt = format_prompt([system_message] + history, chat_config)
    print(prompt)
    completion_resp = await oai.Completion.acreate(
        model="DolphinMistral",
        stream=True,
        prompt=prompt,
        max_tokens=2000,
        stop=[chat_config.suffix, chat_config.user_prefix, chat_config.ai_prefix],
    )

    chunk: oai.Completion
    ai_response = ""
    async for chunk in completion_resp:  # type: ignore
        resp = chunk["choices"][0]["text"]
        yield resp
        ai_response += resp

    await insert_chat_message(
        db,
        thread.id,
        ChatMessage(
            role=ChatRole.ai,
            content=ai_response,
        ),
    )
    await db.commit()
