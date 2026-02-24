from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from .db import Base

class Rider(Base):
    __tablename__ = "riders"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    fc_rider_id = Column(Integer, nullable=False, unique=True)

class Race(Base):
    __tablename__ = "races"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    fc_race_id = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    __table_args__ = (UniqueConstraint("fc_race_id", "year", name="uq_race_year"),)

class Watch(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    __table_args__ = (UniqueConstraint("rider_id", "race_id", name="uq_watch"),)

class Entry(Base):
    __tablename__ = "entries"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    detected_at = Column(DateTime, nullable=False)
    __table_args__ = (UniqueConstraint("rider_id", "race_id", name="uq_entry"),)

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    position = Column(String, nullable=True)
    status = Column(String, nullable=True)
    updated_at = Column(DateTime, nullable=False)
    __table_args__ = (UniqueConstraint("rider_id", "race_id", name="uq_result"),)
