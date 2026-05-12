"""Agent config CRUD + chat endpoint."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import AgentConfig, AgentRun
from ..schemas import AgentConfigIn, ChatRequest
from . import runner

router = APIRouter()


@router.get("/agents")
def list_agents(s: Session = Depends(get_session)) -> list[AgentConfig]:
    return list(s.exec(select(AgentConfig).order_by(AgentConfig.id)))


@router.get("/agents/{code}")
def get_agent(code: str, s: Session = Depends(get_session)) -> AgentConfig:
    a = s.exec(select(AgentConfig).where(AgentConfig.code == code)).first()
    if not a:
        raise HTTPException(404, "not found")
    return a


@router.post("/agents")
def create_agent(body: AgentConfigIn, s: Session = Depends(get_session)) -> AgentConfig:
    if s.exec(select(AgentConfig).where(AgentConfig.code == body.code)).first():
        raise HTTPException(400, "code already exists")
    a = AgentConfig(**body.model_dump())
    s.add(a); s.commit(); s.refresh(a)
    return a


@router.put("/agents/{code}")
def update_agent(code: str, body: AgentConfigIn, s: Session = Depends(get_session)) -> AgentConfig:
    a = s.exec(select(AgentConfig).where(AgentConfig.code == code)).first()
    if not a:
        raise HTTPException(404, "not found")
    a.name = body.name
    a.description = body.description
    a.scenario = body.scenario
    a.avatar = body.avatar
    a.system_prompt = body.system_prompt
    a.tools = body.tools
    a.retrieval_object_types = body.retrieval_object_types
    s.add(a); s.commit(); s.refresh(a)
    return a


@router.get("/agents/{code}/runs")
def list_runs(code: str, s: Session = Depends(get_session)) -> list[AgentRun]:
    return list(s.exec(
        select(AgentRun).where(AgentRun.agent_code == code).order_by(AgentRun.id.desc())
    ).all()[:20])


@router.post("/agents/{code}/chat")
async def chat(code: str, body: ChatRequest, s: Session = Depends(get_session)) -> dict[str, Any]:
    run = await runner.run_agent(code, body.message, body.paper_id, s)
    final = ""
    for m in reversed(run.messages or []):
        if m.get("role") == "assistant" and m.get("content"):
            final = m["content"]
            break
    return {
        "run_id": run.id,
        "final_message": final,
        "tool_calls": run.tool_calls,
    }
