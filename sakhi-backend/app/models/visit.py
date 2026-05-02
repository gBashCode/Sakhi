import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Visit(Base):
    __tablename__ = "visits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), unique=True) # from phone
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'))
    asha_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    bp_sys = Column(Integer, nullable=True)
    bp_dia = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    symptoms = Column(JSON, default=[])
    risk_level = Column(Enum('low','medium','high', name='risk_level'), default='low')
    device_ts = Column(DateTime, nullable=False)
    server_ts = Column(DateTime, default=datetime.utcnow)
    synced = Column(Boolean, default=True)
