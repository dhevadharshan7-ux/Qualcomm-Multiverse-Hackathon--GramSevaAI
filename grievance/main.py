"""Grievance Platform API (CONTRACT.md §4). Mounted into the orchestrator app."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from dal.factory import get_dal
from dal.interface import DAL
from grievance import service
from grievance.schemas import GrievanceOut
from grievance.sync import sync_to_gov_cloud
from shared.db import get_db
from shared.schemas import NewGrievanceFields

router = APIRouter()


@router.post("", response_model=GrievanceOut, status_code=201)
def create_grievance(
    payload: NewGrievanceFields,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    dal: DAL = Depends(get_dal),
):
    row = service.create_grievance(db, dal, payload)
    background_tasks.add_task(sync_to_gov_cloud, str(row.id))
    return service.to_out(row)


@router.get("/{grievance_id}", response_model=GrievanceOut)
def get_grievance(grievance_id: str, db=Depends(get_db)):
    row = service.get_grievance(db, grievance_id)
    if row is None:
        raise HTTPException(status_code=404, detail="grievance not found")
    return service.to_out(row)
