from importlib import resources
from pathlib import Path
from typing import Any, Iterable, Literal, Optional, Type, TypeVar

import aiosqlite
import sqlite_vss
from aiosqlite.context import contextmanager
from pydantic import BaseModel

from . import config
from .models import ChatMessage, ChatRole

AnyModel = TypeVar("AnyModel", bound=BaseModel)


class PydanticCursor(aiosqlite.Cursor):
    """
    Extends the default aiosqlite cursor to return pydantic models with correct type hints.
    """

    def __init__(self, cursor: aiosqlite.Cursor) -> None:
        super().__init__(cursor._conn, cursor._cursor)

    def set_model_factory(
        self,
        model: Type[AnyModel],
    ):
        fields = [column[0] for column in self.description]

        def factory(_, row: Iterable[Any]) -> AnyModel:
            return model(**{k: v for k, v in zip(fields, row)})

        self.row_factory = factory

    async def fetchmany_as(
        self, model: Type[AnyModel], size: Optional[int] = 1
    ) -> list[AnyModel]:
        self.set_model_factory(model)
        return list(await super().fetchmany(size))  # type: ignore

    async def fetchall_as(self, model: Type[AnyModel]) -> list[AnyModel]:
        self.set_model_factory(model)
        return list(await super().fetchall())  # type: ignore

    async def fetchone_as(self, model: Type[AnyModel]) -> AnyModel | None:
        self.set_model_factory(model)
        return await super().fetchone()  # type: ignore


class Database:
    path: Path | Literal[":memory:"]
    _connection: Optional[aiosqlite.Connection]

    def __init__(
        self,
        path: Path | Literal[":memory:"] = config.DB_PATH,
    ):
        self.path = path

    async def connect(self):
        db_exists = isinstance(self.path, Path) and self.path.exists()
        self._connection = await aiosqlite.connect(
            self.path,
            check_same_thread=False,
        )  # type: ignore

        # Enable vector search
        await self._connection.enable_load_extension(True)
        await self._connection.load_extension(sqlite_vss.vector_loadable_path())
        await self._connection.load_extension(sqlite_vss.vss_loadable_path())
        await self._connection.enable_load_extension(False)

        if not db_exists:
            await self.initialize()

    async def disconnect(self):
        await self.connection.close()

    def commit(self):
        return self.connection.commit()

    async def initialize(self):
        init_script = resources.read_text(__name__.rsplit(".", 1)[0], "init_db.sql")
        await self.connection.executescript(init_script)
        await self.connection.executemany(
            """
            insert into chat_roles(name)
            values (?);
            """,
            [(r.value,) for r in ChatRole],
        )
        test_user_name = "test"
        await self.connection.execute(
            """
            insert into profiles(name)
            values (?);
            """,
            (test_user_name,),
        )
        await self.connection.execute(
            """
            insert into chat_conversations(profile_id)
            values ((select id from profiles where name = ?));
            """,
            (test_user_name,),
        )
        await self.connection.commit()

    @property
    def connection(self) -> aiosqlite.Connection:
        if self._connection is None:
            raise RuntimeError("Tried to access database without connecting")
        return self._connection

    @staticmethod
    def placeholders(n: int) -> str:
        return ",".join(["?"] * n)

    async def insert_chat_message(self, message: ChatMessage) -> Optional[int]:
        """Inserts a new chat message into the database and returns its id"""
        assert (
            message.conversation_id is not None
        ), "Message must have a conversation_id!"
        result = await self.connection.execute_insert(
            """
        insert into chat_messages(conversation_id, content, role_id)
        values (?, ?, (select id from chat_roles where name = ?))
        """,
            (message.conversation_id, message.content, message.role.value),
        )
        return result[0] if result else None

    @contextmanager
    async def execute(
        self, sql: str, parameters: Optional[Iterable[Any]] = None
    ) -> PydanticCursor:
        return PydanticCursor(await self.connection.execute(sql, parameters))

    @contextmanager
    async def executemany(
        self, sql: str, parameters: Optional[Iterable[Any]] = None
    ) -> PydanticCursor:
        return PydanticCursor(await self.connection.executemany(sql, parameters))
