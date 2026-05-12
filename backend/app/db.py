import json
from datetime import datetime, date
from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "audit_ontology.db"


def _json_default(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _json_serializer(value):
    return json.dumps(value, ensure_ascii=False, default=_json_default)


engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
    json_serializer=_json_serializer,
)


def init_db() -> None:
    from . import models  # noqa: F401 — ensure tables are registered
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
