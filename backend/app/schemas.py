from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import ProjectStatus


# ---------- Tenant ----------
class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    plan: str
    credit_balance: int
    created_at: datetime


# ---------- User ----------
class UserCreate(BaseModel):
    tenant_id: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: Optional[str]
    role: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Project ----------
class ArchitectureLayer(BaseModel):
    layer: str
    tech: str
    desc: str


class ProjectGenerateRequest(BaseModel):
    """What the frontend sends to /generate — intent + optional stack hints."""
    tenant_id: str
    name: str = Field(..., min_length=1, max_length=200, description="Required — no default project name is ever applied")
    intent: str = Field(..., min_length=1)
    stack: List[str] = Field(default_factory=list)


class ProjectCreate(BaseModel):
    tenant_id: str
    name: str
    intent: str
    description: Optional[str] = None
    architecture: List[ArchitectureLayer] = Field(default_factory=list)
    files: Dict[str, str] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    """
    Used for re-saving a project that already exists. Because the project
    is identified by its `id` in the URL path, calling this twice in a row
    with the same id always UPDATEs the same row — it cannot create a
    duplicate, unlike the old localStorage approach which re-minted a new
    timestamp-based id on every render.
    """
    name: Optional[str] = None
    description: Optional[str] = None
    architecture: Optional[List[ArchitectureLayer]] = None
    files: Optional[Dict[str, str]] = None
    status: Optional[ProjectStatus] = None
    repo_provider: Optional[str] = None
    repo_url: Optional[str] = None
    repo_branch: Optional[str] = None
    repo_owner: Optional[str] = None
    repo_name: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    intent: str
    description: Optional[str]
    architecture: List[Dict[str, Any]]
    files: Dict[str, str]
    status: ProjectStatus
    repo_provider: Optional[str]
    repo_url: Optional[str]
    repo_branch: Optional[str]
    repo_owner: Optional[str]
    repo_name: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class ProjectSummary(BaseModel):
    """Lightweight version for list views — omits the (potentially large) files blob."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    repo_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


# ---------- Deployments ----------
class DeployEventCreate(BaseModel):
    environment: str = "production"
    version: Optional[str] = None
    deployed_by: Optional[str] = None
    url: Optional[str] = None
    simulated: bool = False


class DeployEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    environment: str
    version: Optional[str]
    deployed_by: Optional[str]
    url: Optional[str]
    simulated: bool
    received_at: datetime


# ---------- Git push ----------
class GitPushRequest(BaseModel):
    provider: str = "github"
    repo_url: str
    branch: Optional[str] = None
    token: str  # passed once per request, never persisted to the DB
