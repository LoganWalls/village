from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

app = FastAPI()
oai = ChatOpenAI(
    openai_api_base="http://localhost:7777/v1",
    openai_api_key="sk-blah",
    max_tokens=200,
)


@app.get("/foo")
async def root():
    return {"message": "Hello World"}


@app.websocket("/ws-chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data: dict = await websocket.receive_json()
        message = data["message"]
        chunk_stream = oai.astream(
            [
                SystemMessage(content="You are a helpful AI assistant named Zephyr."),
                HumanMessage(content=message),
            ]
        )
        async for chunk in chunk_stream:
            await websocket.send_text(
                f'<div id="history" hx-swap-oob="beforeend">{chunk.content}</div>'
            )


# Declare static files at the end because order matters in FastAPI:
# https://fastapi.tiangolo.com/tutorial/path-params/?h=order+matters#order-matters
app.mount("/", StaticFiles(directory="ui/dist"), name="ui")
