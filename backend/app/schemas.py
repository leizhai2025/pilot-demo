"""Pydantic request/response schemas. Keep them thin — most reads return ORM models directly."""
from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class PropertyDef(BaseModel):
    code: str
    label: str
    type: str = "string"          # string | number | enum | json | text | date | money
    required: bool = False
    default: Any | None = None
    enum: list[str] | None = None
    help: str | None = None


class ObjectTypeIn(BaseModel):
    code: str
    display_name: str
    description: str = ""
    icon: str = "Cube"
    color: str = "#6366f1"
    properties_schema: list[PropertyDef] = []


class LinkTypeIn(BaseModel):
    code: str
    display_name: str
    source_type_code: str
    target_type_code: str
    cardinality: str = "many"
    description: str = ""


class ActionTypeIn(BaseModel):
    code: str
    display_name: str
    description: str = ""
    target_type_code: str
    kind: str
    parameters_schema: list[PropertyDef] = []


class ObjectInstanceIn(BaseModel):
    type_code: str
    display_name: str = ""
    data: dict[str, Any] = {}


class AgentConfigIn(BaseModel):
    code: str
    name: str
    description: str = ""
    scenario: str = "working_paper_fill"
    avatar: str = "Bot"
    system_prompt: str = ""
    tools: list[dict[str, Any]] = []
    retrieval_object_types: list[str] = []


class ChatRequest(BaseModel):
    message: str
    agent_code: str | None = None
    paper_id: int | None = None
