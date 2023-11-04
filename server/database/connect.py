import sqlite3
from importlib import resources
from pathlib import Path
from sqlite3.dbapi2 import _Parameters
from typing import Any, Callable, Iterable, Optional, Protocol, Type, TypeVar

import sqlite_vss
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class PydanticCursor(sqlite3.Cursor):
    """
    Extends the default sqlite cursor to return pydantic models with correct type hints.
    """

    def factory_for(
        self, model: Type[T]
    ) -> Callable[[sqlite3.Cursor, Iterable[Any]], T]:
        fields = [column[0] for column in self.description]

        def factory(_, row: Iterable[Any]) -> T:
            return model(**{k: v for k, v in zip(fields, row)})

        return factory

    def fetchmany_as(self, model: Type[T], size: Optional[int] = 1) -> list[T]:
        self.row_factory = self.factory_for(model)
        return super().fetchmany(size)

    def fetchall_as(self, model: Type[T]) -> list[T]:
        self.row_factory = self.factory_for(model)
        return super().fetchall()

    def fetchone_as(self, model: Type[T]) -> list[T]:
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


class PydanticConnection(UsesPydanticCursor, sqlite3.Connection):
    ...


def initialize(db: PydanticConnection):
    init_script = resources.read_text(__name__.rsplit(".", 1)[0], "init.sql")
    db.executescript(init_script)


def connect(path: Optional[Path]) -> PydanticConnection:
    db_exists = path and path.exists()
    db: PydanticConnection = sqlite3.connect(path or ":memory:", factory=PydanticConnection)  # type: ignore
    db.enable_load_extension(True)
    sqlite_vss.load(db)
    db.enable_load_extension(False)
    if not db_exists:
        initialize(db)
    return db
