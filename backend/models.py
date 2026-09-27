from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # PDF, DOCX, PPTX, TXT
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    cleaned_file_path = Column(String, nullable=True)
    status = Column(String, default="Uploaded")  # Uploaded, Scanned, Cleaned
    extracted_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="documents")
    metadata_entries = relationship("DocumentMetadata", back_populates="document", cascade="all, delete-orphan")
    analyses = relationship("DocumentAnalysis", back_populates="document", cascade="all, delete-orphan")
    cleaning_actions = relationship("CleaningAction", back_populates="document", cascade="all, delete-orphan")


class DocumentAnalysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    ai_likelihood = Column(Integer, nullable=False)  # 0 to 100 percentage
    indicator_level = Column(String, nullable=False) # low, moderate, elevated
    signals = Column(Text, nullable=False)           # JSON string of detected text sections & reasons
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="analyses")


class DocumentMetadata(Base):
    __tablename__ = "metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    metadata_key = Column(String, nullable=True)
    field_name = Column(String, nullable=True)
    metadata_value = Column(String, nullable=True)
    field_value = Column(String, nullable=True)
    removable = Column(Boolean, default=True)
    removed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="metadata_entries")


class CleaningAction(Base):
    __tablename__ = "cleaning_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    removed_fields = Column(Text, nullable=True)
    removed_metadata = Column(Text, nullable=True)  # JSON or comma-separated list of keys
    text_changes = Column(Text, nullable=True)       # JSON string of text diffs
    before_state = Column(Text, nullable=True)       # JSON string of before metadata
    after_state = Column(Text, nullable=True)        # JSON string of after metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="cleaning_actions")
