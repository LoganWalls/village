from importlib import resources
from pathlib import Path
from typing import Any, Iterable, Literal, Optional, Type, TypeVar

import aiosqlite
import sqlite_vss
from aiosqlite import Connection, Cursor
from pydantic import BaseModel

from . import config
from .models import ChatMessage, ChatRole

AnyModel = TypeVar("AnyModel", bound=BaseModel)


def set_model_factory(
    cursor: Cursor,
    model: Type[AnyModel],
):
    fields = [column[0] for column in cursor.description]

    def factory(_, row: Iterable[Any]) -> AnyModel:
        return model(**{k: v for k, v in zip(fields, row)})

    cursor.row_factory = factory


async def fetchmany_as(
    cursor: Cursor, model: Type[AnyModel], size: Optional[int] = 1
) -> list[AnyModel]:
    set_model_factory(cursor, model)
    return list(await cursor.fetchmany(size))  # type: ignore


async def fetchall_as(cursor: Cursor, model: Type[AnyModel]) -> list[AnyModel]:
    set_model_factory(cursor, model)
    return list(await cursor.fetchall())  # type: ignore


async def fetchone_as(cursor: Cursor, model: Type[AnyModel]) -> AnyModel | None:
    set_model_factory(cursor, model)
    return await cursor.fetchone()  # type: ignore


async def insert_chat_message(db: Connection, thread_id: int, message: ChatMessage) -> Optional[int]:
    """Inserts a new chat message into the database and returns its id"""
    result = await db.execute_insert(
        """
    insert into chat_messages(thread_id, content, role_id)
    values (?, ?, (select id from chat_roles where name = ?))
    """,
        (thread_id, message.content, message.role.value),
    )
    return result[0] if result else None


def placeholders(n: int) -> str:
    return ",".join(["?"] * n)


async def initialize(db: Connection):
    init_script = resources.read_text(__name__.rsplit(".", 1)[0], "init_db.sql")
    await db.executescript(init_script)
    await db.executemany(
        """
        insert into chat_roles(name)
        values (?);
        """,
        [(r.value,) for r in ChatRole],
    )
    test_profiles = [("Test Profile",), ("Alternative Profile",)]
    await db.executemany(
        """
        insert into profiles(name)
        values (?);
        """,
        test_profiles,
    )
    await db.executemany(
        """
        insert into chat_threads(profile_id)
        values ((select id from profiles where name = ?));
        """,
        test_profiles + test_profiles,  # insert two threads per profile
    )
    await db.commit()


async def connect(
    path: Path | Literal[":memory:"] = config.DB_PATH,
) -> Connection:
    db_exists = isinstance(path, Path) and path.exists()
    db = await aiosqlite.connect(path, check_same_thread=False)
    # Enable vector search
    await db.enable_load_extension(True)
    await db.load_extension(sqlite_vss.vector_loadable_path())
    await db.load_extension(sqlite_vss.vss_loadable_path())
    await db.enable_load_extension(False)

    if not db_exists:
        await initialize(db)

    return db
