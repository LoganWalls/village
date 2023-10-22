import asyncio
from typing import AsyncIterable, Awaitable

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)

__all__ = ["stream_chat_message"]

# TODO: wrap this in a manager class instead of global
oai_chat = ChatOpenAI(
    openai_api_base="http://localhost:7777/v1",
    openai_api_key="sk-blah",
    max_tokens=2000,
    streaming=True,
)
prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a nice chatbot having a conversation with a human."
        ),
        # The `variable_name` here is what must align with memory
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template("{user_input}"),
    ]
)
# Notice that we `return_messages=True` to fit into the MessagesPlaceholder
# Notice that `"chat_history"` aligns with the MessagesPlaceholder name
memory = ConversationBufferWindowMemory(
    memory_key="chat_history", return_messages=True, k=2
)
conversation = LLMChain(llm=oai_chat, prompt=prompt, verbose=True, memory=memory)


async def wrap_iter(fn: Awaitable, event: asyncio.Event):
    try:
        await fn
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        event.set()


async def stream_chat_message(message: str) -> AsyncIterable[str]:
    callback = AsyncIteratorCallbackHandler()
    task = asyncio.create_task(
        wrap_iter(
            conversation.arun(dict(user_input=message), callbacks=[callback]),
            callback.done,
        ),
    )
    async for chunk in callback.aiter():
        yield chunk
    await task
