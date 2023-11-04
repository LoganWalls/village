from ..database import PydanticConnection
from .schemas import ChatMessage


def get_history(db: PydanticConnection, session_id: int):
    return db.execute(
        """
        select id, role, content, timestamp
        from chat_messages
        where session_id = ?;
        """,
        (session_id,),
    ).fetchall_as(ChatMessage)

def save_message(db: PydanticConnection, session_id: int, message: ChatMessage):
    return db.execute(
        """
        insert into chat_messages(session_id, role, content)
        values (?, ?, ?);
        """,
        (session_id, message.role, message.content)
    )
