"""SMS outbox worker entrypoint.

Run continuously:  python -m app.worker
Run once (cron):   python -m app.worker --once
"""

import sys
import time

from app.database import SessionLocal
from app.services.notification_worker import process_due_notifications

POLL_SECONDS = 5


def run_once() -> dict:
    db = SessionLocal()
    try:
        return process_due_notifications(db)
    finally:
        db.close()


def run_loop() -> None:
    print("SMS worker started; polling every", POLL_SECONDS, "s")
    while True:
        result = run_once()
        if result["picked"]:
            print("processed:", result)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    if "--once" in sys.argv:
        print(run_once())
    else:
        run_loop()