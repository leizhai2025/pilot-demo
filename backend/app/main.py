"""FastAPI entrypoint."""
from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .db import init_db
from .seed import seed as run_seed
from .llm import is_demo, MODEL_ID
from .ontology.router import router as ontology_router
from .agents.router import router as agents_router
from .mcp_registry import router as mcp_router
from .intake.router import router as intake_router
from .corrections.router import router as corrections_router
from .templates.router import router as templates_router
from .rules.router import router as rules_router

app = FastAPI(title="Audit Ontology Prototype", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.on_event("startup")
def _startup() -> None:
    init_db()
    if os.environ.get("AUDIT_ONTOLOGY_SKIP_SEED", "0") != "1":
        run_seed()


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "llm_demo_mode": is_demo(),
        "model": MODEL_ID,
    }


app.include_router(ontology_router, prefix="/api/ontology", tags=["ontology"])
app.include_router(agents_router, prefix="/api", tags=["agents"])
app.include_router(mcp_router, prefix="/api", tags=["mcp"])
app.include_router(intake_router, prefix="/api", tags=["intake"])
app.include_router(corrections_router, prefix="/api", tags=["corrections"])
app.include_router(templates_router, prefix="/api", tags=["templates"])
app.include_router(rules_router, prefix="/api", tags=["rules"])
