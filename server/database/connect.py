import sqlite3
from importlib import resources
from pathlib import Path
from sqlite3.dbapi2 import _Parameters
from typing import Any, Callable, Iterable, Optional, Protocol, Type, TypeVar

import sqlite_vss
from pydantic import BaseModel

from ..chat.schemas import ChatRole

AnyModel = TypeVar("AnyModel", bound=BaseModel)


class PydanticCursor(sqlite3.Cursor):
    """
    Extends the default sqlite cursor to return pydantic models with correct type hints.
    """

    def factory_for(
        self, model: Type[AnyModel]
    ) -> Callable[[sqlite3.Cursor, Iterable[Any]], AnyModel]:
        fields = [column[0] for column in self.description]

        def factory(_, row: Iterable[Any]) -> AnyModel:
            return model(**{k: v for k, v in zip(fields, row)})

        return factory

    def fetchmany_as(
        self, model: Type[AnyModel], size: Optional[int] = 1
    ) -> list[AnyModel]:
        self.row_factory = self.factory_for(model)
        return super().fetchmany(size)

    def fetchall_as(self, model: Type[AnyModel]) -> list[AnyModel]:
        self.row_factory = self.factory_for(model)
        return super().fetchall()

    def fetchone_as(self, model: Type[AnyModel]) -> list[AnyModel]:
        self.row_factory = self.factory_for(model)
        return super().fetchone()


class UsesPydanticCursor(Protocol):
    def execute(self, sql: str, parameters: _Parameters = ...) -> PydanticCursor:
        ...

    def executemany(
        self, __sql: str, __parameters: Iterable[_Parameters]
    ) -> PydanticCursor:
        ...

    def executescript(self, __sql_script: str) -> PydanticCursor:
        ...


AnyModel = TypeVar("AnyModel", bound=BaseModel)


class PydanticConnection(UsesPydanticCursor, sqlite3.Connection):
    @staticmethod
    def placeholders(n: int) -> str:
        return ",".join(["?"] * n)

    def insert(self, table: str, model: BaseModel) -> PydanticCursor:
        """
        Insert a pydantic `model` into a SQL `table`
        `**kwargs` are passed to `model.dict()`
        """
        keys, values = zip(*model.dict().items())
        return self.execute(
            f"""
            insert into {table}({','.join(keys)})
            values ({self.placeholders(len(keys))})
            """,
            values,
        )

    def insert_many(self, table: str, models: list[AnyModel], **kwargs) -> PydanticCursor:
        """
        Insert many pydantic `models` into a SQL `table`
        `**kwargs` are passed to `model.dict()`
        """
        data = [m.dict(**kwargs) for m in models]
        keys = data[0].keys()
        return self.executemany(
            f"""
            insert into {table}({','.join(keys)})
            values ({self.placeholders(len(keys))})
            """,
            [tuple(d[k] for k in keys) for d in data],
        )


def initialize(db: PydanticConnection):
    init_script = resources.read_text(__name__.rsplit(".", 1)[0], "init.sql")
    db.executescript(init_script)
    db.executemany(
        """
        insert into chat_roles(name)
        values (?);
        """,
        [(r.value,) for r in ChatRole],
    )


def connect(path: Optional[Path]) -> PydanticConnection:
    db_exists = path and path.exists()
    db: PydanticConnection = sqlite3.connect(path or ":memory:", factory=PydanticConnection)  # type: ignore
    db.enable_load_extension(True)
    sqlite_vss.load(db)
    db.enable_load_extension(False)
    if not db_exists:
        initialize(db)
    return db
