from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.config import settings
from app.routers import tenants, projects, generate, git_push, deployments


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sandbox.ai API",
    description="Generate, push, and track deployments for AI-scaffolded projects.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(generate.router, prefix="/api/v1")
app.include_router(git_push.router, prefix="/api/v1")
app.include_router(deployments.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "sandbox-ai-api"}
