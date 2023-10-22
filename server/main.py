from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import chat, config

app = FastAPI()
origins = [config.UI_DEV_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat/stream")
async def chat_stream(request: chat.ChatStreamRequest):
    return StreamingResponse(
        chat.stream_chat_message(request.message),
        media_type="text/event-stream",
    )

# Declare static files at the end because order matters in FastAPI:
# https://fastapi.tiangolo.com/tutorial/path-params/?h=order+matters#order-matters
app.mount("/", StaticFiles(directory="ui/dist"), name="ui")
