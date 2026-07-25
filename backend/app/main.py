from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, appointments, auth, availability, contact, notifications, services

app = FastAPI(title="Homeopath Consultation API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = "/api/v1"
app.include_router(auth.router, prefix=api_v1)
app.include_router(services.router, prefix=api_v1)
app.include_router(availability.router, prefix=api_v1)
app.include_router(appointments.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(contact.router, prefix=api_v1)


@app.get("/health")
def health():
    return {"status": "ok"}
