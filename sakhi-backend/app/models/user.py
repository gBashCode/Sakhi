import uuid
from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String, unique=True, index=True, nullable=False)
    pin_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum('ASHA','ANM','PHC', name='user_role'), default='ASHA')
    village_id = Column(UUID(as_uuid=True), nullable=True)
