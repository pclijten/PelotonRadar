from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .models import Watch, Rider, Race, Entry, Result
from .fc_client import rider_in_startlist, rider_result
from .mailer import send_email

def utcnow_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def run_watch_check(db: Session):
    watches = db.query(Watch).all()

    for w in watches:
        rider = db.get(Rider, w.rider_id)
        race = db.get(Race, w.race_id)
        if not rider or not race:
            continue

        existing_entry = db.query(Entry).filter_by(rider_id=rider.id, race_id=race.id).first()
        if not existing_entry:
            try:
                in_list = rider_in_startlist(race.fc_race_id, race.year, rider.fc_rider_id)
            except Exception:
                in_list = False

            if in_list:
                db.add(Entry(rider_id=rider.id, race_id=race.id, detected_at=utcnow_naive()))
                db.commit()
                send_email(
                    f"Startlijst: {rider.name} start in {race.name} ({race.year})",
                    f"{rider.name} staat op de startlijst van {race.name} ({race.year})."
                )

        try:
            pos, status = rider_result(race.fc_race_id, race.year, rider.fc_rider_id)
        except Exception:
            pos, status = (None, None)

        if pos is not None:
            existing_res = db.query(Result).filter_by(rider_id=rider.id, race_id=race.id).first()
            if not existing_res:
                db.add(Result(
                    rider_id=rider.id,
                    race_id=race.id,
                    position=pos,
                    status=status,
                    updated_at=utcnow_naive()
                ))
                db.commit()
                send_email(
                    f"Uitslag: {rider.name} in {race.name} ({race.year})",
                    f"Resultaat: {pos}" + (f" ({status})" if status else "")
                )
            else:
                if existing_res.position != pos or (status and existing_res.status != status):
                    existing_res.position = pos
                    existing_res.status = status
                    existing_res.updated_at = utcnow_naive()
                    db.commit()
                    send_email(
                        f"Update uitslag: {rider.name} in {race.name} ({race.year})",
                        f"Nieuwe uitslag: {pos}" + (f" ({status})" if status else "")
                    )
