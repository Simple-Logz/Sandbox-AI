from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/projects/{project_id}/deployments", tags=["Deployments"])


@router.post("/", response_model=schemas.DeployEventResponse, status_code=201)
def receive_deploy_signal(project_id: str, payload: schemas.DeployEventCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    event = models.DeployEvent(project_id=project_id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/", response_model=List[schemas.DeployEventResponse])
def list_deploy_events(project_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.DeployEvent)
        .filter(models.DeployEvent.project_id == project_id)
        .order_by(models.DeployEvent.received_at.desc())
        .limit(50)
        .all()
    )
