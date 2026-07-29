import logging
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    account,
    admin_appointments,
    admin_dashboard,
    admin_notifications,
    appointments,
    auth,
    availability,
    booking,
    chatbot,
    health,
    slots,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Homeopathy Consultation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(',') if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"

app.include_router(health.router, prefix=API_V1)
app.include_router(auth.router, prefix=API_V1)
app.include_router(slots.router, prefix=API_V1)
app.include_router(availability.router, prefix=API_V1)
app.include_router(booking.router, prefix=API_V1)
app.include_router(appointments.router, prefix=API_V1)
app.include_router(account.router, prefix=API_V1)
app.include_router(admin_appointments.router, prefix=API_V1)
app.include_router(admin_notifications.router, prefix=API_V1)
app.include_router(admin_dashboard.router, prefix=API_V1)
app.include_router(chatbot.router, prefix=API_V1)


def _start_worker_thread() -> None:
    from app.worker import run_loop

    def _safe_loop() -> None:
        try:
            run_loop()
        except Exception:
            logger.exception("Worker thread crashed — SMS delivery paused")

    t = threading.Thread(target=_safe_loop, daemon=True, name="sms-worker")
    t.start()
    logger.info("SMS worker thread started (daemon)")


@app.on_event("startup")
def startup_event() -> None:
    import os
    if os.getenv("EMBEDDED_WORKER", "false").lower() == "true":
        _start_worker_thread()