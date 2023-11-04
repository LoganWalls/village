from pathlib import Path
from typing import Optional

import sqlite_vss
from sqlalchemy.engine import Engine
from sqlalchemy.pool.base import event
from sqlmodel import Session, SQLModel, create_engine

from . import models


def initialize(engine: Engine):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([models.ChatRole(name=d.value) for d in models.ChatRoleEnum])
        session.commit()


def connect(path: Optional[Path]) -> Engine:
    db_exists = path and path.exists()
    sqlite_url = f"sqlite:///{path or ':memory'}"
    engine = create_engine(sqlite_url)

    def enable_vss(db, _):
        db.enable_load_extension(True)
        sqlite_vss.load(db)
        db.enable_load_extension(False)

    event.listens_for(engine, "connect")(enable_vss)

    if not db_exists:
        initialize(engine)

    return engine
