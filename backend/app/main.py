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

app = FastAPI(title="Homeopathy Consultation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
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
