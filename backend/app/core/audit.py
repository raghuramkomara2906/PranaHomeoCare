import ipaddress
import uuid

from sqlalchemy.orm import Session

from app.models import AuditEvent


def safe_inet(host: str | None) -> str | None:
    """Return `host` only if it's a valid IP literal, else None.

    `request.client.host` isn't guaranteed to be an IP — the test client sends
    "testclient", and some socket/proxy setups pass hostnames — and the audit
    `ip_address` column is a Postgres INET, which rejects non-IP text.
    """
    if not host:
        return None
    try:
        ipaddress.ip_address(host)
        return host
    except ValueError:
        return None


def record_audit(
    db: Session,
    *,
    action: str,
    actor_admin_id: uuid.UUID | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    request_id: uuid.UUID | None = None,
    metadata: dict | None = None,
) -> AuditEvent:
    """Append one immutable audit row. Callers must NEVER pass passwords, plain
    OTPs, raw Zoom URLs, or auth tokens in `metadata` (see DB doc §7.2)."""
    event = AuditEvent(
        action=action,
        actor_admin_id=actor_admin_id,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        event_metadata=metadata,
    )
    db.add(event)
    return event