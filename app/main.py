from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .db import Base, engine, SessionLocal
from .models import Rider, Race, Watch, Entry, Result
from .watcher import run_watch_check

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PelotonRadar")

class RiderIn(BaseModel):
    name: str
    fc_rider_id: int

class RaceIn(BaseModel):
    name: str
    fc_race_id: int
    year: int

class WatchIn(BaseModel):
    rider_id: int
    race_id: int

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/riders")
def add_rider(payload: RiderIn):
    db = SessionLocal()
    try:
        r = Rider(name=payload.name, fc_rider_id=payload.fc_rider_id)
        db.add(r)
        db.commit()
        db.refresh(r)
        return {"id": r.id, "name": r.name, "fc_rider_id": r.fc_rider_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Could not add rider: {e}")
    finally:
        db.close()

@app.get("/riders")
def list_riders():
    db = SessionLocal()
    try:
        riders = db.query(Rider).all()
        return [{"id": r.id, "name": r.name, "fc_rider_id": r.fc_rider_id} for r in riders]
    finally:
        db.close()

@app.post("/races")
def add_race(payload: RaceIn):
    db = SessionLocal()
    try:
        race = Race(name=payload.name, fc_race_id=payload.fc_race_id, year=payload.year)
        db.add(race)
        db.commit()
        db.refresh(race)
        return {"id": race.id, "name": race.name, "fc_race_id": race.fc_race_id, "year": race.year}
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Could not add race: {e}")
    finally:
        db.close()

@app.get("/races")
def list_races():
    db = SessionLocal()
    try:
        races = db.query(Race).all()
        return [{"id": r.id, "name": r.name, "fc_race_id": r.fc_race_id, "year": r.year} for r in races]
    finally:
        db.close()

@app.post("/watchlist")
def add_watch(payload: WatchIn):
    db = SessionLocal()
    try:
        if not db.get(Rider, payload.rider_id):
            raise HTTPException(404, "Rider not found")
        if not db.get(Race, payload.race_id):
            raise HTTPException(404, "Race not found")
        w = Watch(rider_id=payload.rider_id, race_id=payload.race_id)
        db.add(w)
        db.commit()
        db.refresh(w)
        return {"id": w.id, "rider_id": w.rider_id, "race_id": w.race_id}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(400, f"Could not add watch: {e}")
    finally:
        db.close()

@app.get("/riders/{rider_id}/history")
def rider_history(rider_id: int):
    db = SessionLocal()
    try:
        rider = db.get(Rider, rider_id)
        if not rider:
            raise HTTPException(404, "Rider not found")

        entries = db.query(Entry).filter_by(rider_id=rider_id).all()
        results = db.query(Result).filter_by(rider_id=rider_id).all()
        races = {r.id: r for r in db.query(Race).all()}

        entry_map = {e.race_id: e for e in entries}
        result_map = {r.race_id: r for r in results}

        out = []
        for race_id, race in races.items():
            if race_id in entry_map or race_id in result_map:
                out.append({
                    "race": {"id": race.id, "name": race.name, "year": race.year},
                    "started": race_id in entry_map,
                    "start_detected_at": entry_map.get(race_id).detected_at.isoformat() if race_id in entry_map else None,
                    "result_position": result_map.get(race_id).position if race_id in result_map else None,
                    "result_status": result_map.get(race_id).status if race_id in result_map else None,
                    "result_updated_at": result_map.get(race_id).updated_at.isoformat() if race_id in result_map else None,
                })

        return {"rider": {"id": rider.id, "name": rider.name}, "history": out}
    finally:
        db.close()

@app.post("/run-check")
def run_check():
    db = SessionLocal()
    try:
        run_watch_check(db)
        return {"ok": True}
    finally:
        db.close()
