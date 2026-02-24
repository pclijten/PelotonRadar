from firstcyclingapi import FirstCycling

fc = FirstCycling()

def rider_in_startlist(fc_race_id: int, year: int, fc_rider_id: int) -> bool:
    race = fc.races.get_race(fc_race_id, year=year)
    startlist = race.get("startlist") or race.get("start_list") or []
    for item in startlist:
        if isinstance(item, dict):
            if item.get("rider_id") == fc_rider_id:
                return True
            rider = item.get("rider") or {}
            if isinstance(rider, dict) and rider.get("id") == fc_rider_id:
                return True
    return False

def rider_result(fc_race_id: int, year: int, fc_rider_id: int):
    race = fc.races.get_race(fc_race_id, year=year)
    results = race.get("results") or []
    for item in results:
        if isinstance(item, dict):
            rid = item.get("rider_id") or (item.get("rider") or {}).get("id")
            if rid == fc_rider_id:
                pos = item.get("position") or item.get("pos")
                status = item.get("status")
                return (str(pos) if pos is not None else None, status)
    return (None, None)
