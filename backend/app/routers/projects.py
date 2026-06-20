"""
Projects CRUD.

The fix for the old "duplicate save" bug lives in the HTTP semantics here:
- POST /projects creates exactly one row, returns its id.
- PUT /projects/{id} updates that exact row. There is no other way to save —
  the frontend always has the id after the first save and must use PUT for
  every subsequent save. It is impossible to "save" a second copy by
  accident, because there is no operation that both (a) doesn't take an id
  and (b) writes to the database.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=List[schemas.ProjectSummary])
def list_projects(tenant_id: str = Query(...), db: Session = Depends(get_db)):
    return (
        db.query(models.Project)
        .filter(models.Project.tenant_id == tenant_id)
        .order_by(models.Project.updated_at.desc().nullslast(), models.Project.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.ProjectResponse, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Creates exactly one new project row. Called once, when a project is
    first saved — never called again for the same project."""
    project = models.Project(
        tenant_id=payload.tenant_id,
        name=payload.name,
        intent=payload.intent,
        description=payload.description,
        architecture=[a.model_dump() for a in payload.architecture],
        files=payload.files,
        status=models.ProjectStatus.READY,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: str, payload: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """The ONLY way to persist changes to an existing project. Re-saving,
    re-naming, or updating repo info after a push all go through here —
    always the same row, identified by project_id in the URL."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "architecture" in update_data and update_data["architecture"] is not None:
        update_data["architecture"] = [a if isinstance(a, dict) else a.model_dump() for a in update_data["architecture"]]

    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, actor: Optional[str] = None, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    tenant_id = project.tenant_id
    db.delete(project)
    if actor:
        db.add(models.AuditLog(tenant_id=tenant_id, actor=actor, action=f'Deleted project "{project.name}"'))
    db.commit()


@router.post("/{project_id}/rename", response_model=schemas.ProjectResponse)
def rename_project(project_id: str, name: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    project.name = name
    db.commit()
    db.refresh(project)
    return project
