# PelotonRadar (MVP)

FastAPI app that watches selected riders in selected races and emails you when:
- a rider appears on the startlist
- a result becomes available (and updates)

## Local run
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open: http://127.0.0.1:8000/docs

## Deploy (Render)
Use the included `render.yaml` Blueprint.
Set env vars on Render (SMTP_* + MAIL_TO + DB_URL).
Set `WEB_RUN_URL` on the cron service to your web service URL.
