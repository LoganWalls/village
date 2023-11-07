from contextlib import asynccontextmanager

import aiosqlite
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import chat, config, database
from .database import fetchall_as, fetchone_as, insert_chat_message
from .models import ChatMessage, ChatRole, ChatThread, Profile
from .schemas import ChatStreamRequest

db: aiosqlite.Connection


@asynccontextmanager
async def lifespan(_: FastAPI):
    global db
    db = await database.connect()
    yield
    await db.close()


app = FastAPI(lifespan=lifespan)
origins = [config.UI_DEV_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/profiles")
async def list_profiles() -> list[Profile]:
    """List all user profiles"""
    cursor = await db.execute("select id, name from profiles")
    return await fetchall_as(cursor, Profile)


@app.get("/profile/{profile_id}/threads")
async def list_profile_threads(profile_id: int) -> list[ChatThread]:
    """List all threads for a given user profile"""
    cursor = await db.execute(
        "select * from chat_threads where profile_id = ?;", (profile_id,)
    )
    return await fetchall_as(cursor, ChatThread)


@app.post("/chat/stream")
async def chat_stream(request: ChatStreamRequest) -> StreamingResponse:
    # Fetch the current thread
    cursor = await db.execute(
        "select * from chat_threads where id = ? and profile_id = ?;",
        (request.thread_id, request.profile_id),
    )
    thread = await fetchone_as(cursor, ChatThread)
    if not thread:
        raise RuntimeError(f"Could not find thread with id: {request.thread_id}")

    # Create the current message and save it to the database
    await insert_chat_message(
        db,
        ChatMessage(
            role=ChatRole.user,
            content=request.message,
            thread_id=thread.id,
        ),
    )
    await db.commit()

    # Fetch thread history
    cursor = await db.execute(
        """
        select c.id, timestamp, thread_id, r.name as role, content
        from chat_messages as c
        join chat_roles as r on c.role_id = r.id
        where thread_id = ?
        order by timestamp;
        """,
        (thread.id,),
    )
    history = await fetchall_as(cursor, ChatMessage)

    return StreamingResponse(
        chat.stream_model_response(db, thread, history),
        media_type="text/event-stream",
    )


# Declare static files at the end because order matters in FastAPI:
# https://fastapi.tiangolo.com/tutorial/path-params/?h=order+matters#order-matters
app.mount("/", StaticFiles(directory="ui/dist"), name="ui")
