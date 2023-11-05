from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import chat, config, database
from .models import ChatCoversation, ChatMessage, ChatRole
from .schemas import ChatStreamRequest

db = database.Database()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await db.connect()
    yield
    # Clean up the ML models and release the resources
    await db.disconnect()


app = FastAPI(lifespan=lifespan)
origins = [config.UI_DEV_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat/stream")
async def chat_stream(request: ChatStreamRequest):
    # Fetch the current conversation
    conversation = await (
        await db.execute(
            "select * from chat_conversations where id = ? and profile_id = ?;",
            (request.conversation_id, request.profile_id),
        )
    ).fetchone_as(ChatCoversation)
    if not conversation:
        raise RuntimeError(
            f"Could not find conversation with id: {request.conversation_id}"
        )

    # Create the current message and save it to the database
    await db.insert_chat_message(
        ChatMessage(
            role=ChatRole.user,
            content=request.message,
            conversation_id=conversation.id,
        )
    )
    await db.commit()

    # Fetch conversation history
    history = await (
        await db.execute(
            """
        select c.id, timestamp, conversation_id, r.name as role, content
        from chat_messages as c
        join chat_roles as r on c.role_id = r.id
        where conversation_id = ?
        order by timestamp;
        """,
            (conversation.id,),
        )
    ).fetchall_as(ChatMessage)

    return StreamingResponse(
        chat.stream_model_response(db, conversation, history),
        media_type="text/event-stream",
    )


# Declare static files at the end because order matters in FastAPI:
# https://fastapi.tiangolo.com/tutorial/path-params/?h=order+matters#order-matters
app.mount("/", StaticFiles(directory="ui/dist"), name="ui")
