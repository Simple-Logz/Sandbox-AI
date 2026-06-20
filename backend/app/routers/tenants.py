from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("/", response_model=schemas.TenantResponse, status_code=201)
def create_tenant(payload: schemas.TenantCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Tenant).filter(models.Tenant.name == payload.name).first()
    if existing:
        raise HTTPException(409, f'Tenant "{payload.name}" already exists')
    tenant = models.Tenant(name=payload.name)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=schemas.TenantResponse)
def get_tenant(tenant_id: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    return tenant
