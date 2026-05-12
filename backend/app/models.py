"""SQLModel tables for the audit ontology prototype.

Everything Palantir-ish lives in three tables: object_types, link_types, action_types.
Real-world data lives in object_instances (typed by code) with a JSON `data` blob
and link_instances connecting them. Agent configs and runs sit alongside.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, Any

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON, Text


def _utcnow() -> datetime:
    return datetime.utcnow()


# ---------- Ontology schema tables ----------

class ObjectType(SQLModel, table=True):
    __tablename__ = "object_types"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)                # e.g. "WorkingPaper"
    display_name: str                                          # 中文 — e.g. "底稿"
    description: str = ""
    icon: str = "Cube"                                         # lucide icon name
    color: str = "#6366f1"                                     # type accent color
    # list of property definitions: [{code,label,type,required,default,enum?,help?}]
    properties_schema: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    is_seed: bool = False
    created_at: datetime = Field(default_factory=_utcnow)


class LinkType(SQLModel, table=True):
    __tablename__ = "link_types"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    display_name: str
    source_type_code: str
    target_type_code: str
    cardinality: str = "many"                                  # "one" | "many"
    description: str = ""
    is_seed: bool = False


class ActionType(SQLModel, table=True):
    __tablename__ = "action_types"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)                # "FillWorkingPaper"
    display_name: str                                          # "填写底稿"
    description: str = ""
    target_type_code: str                                      # which object type it acts on
    kind: str                                                  # "fill" | "flag" | "apply_rule" | "attach"
    parameters_schema: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    is_seed: bool = False


# ---------- Instance tables ----------

class ObjectInstance(SQLModel, table=True):
    __tablename__ = "object_instances"
    id: Optional[int] = Field(default=None, primary_key=True)
    type_code: str = Field(index=True)
    display_name: str = ""                                     # human label
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class LinkInstance(SQLModel, table=True):
    __tablename__ = "link_instances"
    id: Optional[int] = Field(default=None, primary_key=True)
    link_type_code: str = Field(index=True)
    source_id: int = Field(index=True)
    target_id: int = Field(index=True)


# ---------- Agent tables ----------

class AgentConfig(SQLModel, table=True):
    __tablename__ = "agent_configs"
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str
    description: str = ""
    scenario: str = "working_paper_fill"                       # 底稿填写 | 方案生成 | 异常分析 | 专项审计
    avatar: str = "Bot"
    system_prompt: str = Field(default="", sa_column=Column(Text))
    # list of tool refs: [{kind: "action"|"query"|"mcp", ref: <code or name>}]
    tools: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # which object type codes the agent should retrieve context from
    retrieval_object_types: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_seed: bool = False
    is_stub: bool = False                                      # true for the 3 stubbed scenarios
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class AgentRun(SQLModel, table=True):
    __tablename__ = "agent_runs"
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_code: str = Field(index=True)
    paper_id: Optional[int] = None
    messages: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    tool_calls: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    status: str = "succeeded"
    created_at: datetime = Field(default_factory=_utcnow)


# ---------- MCP registry ----------

class MCPServer(SQLModel, table=True):
    __tablename__ = "mcp_servers"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    transport: str = "stdio"                                   # stdio | http
    command: str = ""
    args: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    env: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    description: str = ""
    enabled: bool = True
    # exposed tools (seeded; in v1 we don't introspect live MCP servers)
    tools: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
