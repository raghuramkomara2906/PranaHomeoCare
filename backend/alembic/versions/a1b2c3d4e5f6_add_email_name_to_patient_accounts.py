"""add email and full_name to patient_accounts, make mobile nullable

Revision ID: a1b2c3d4e5f6
Revises: 0f6a68744b31
Create Date: 2026-08-04
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "0f6a68744b31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make mobile_e164 nullable — email accounts won't have it
    op.alter_column(
        "patient_accounts", "mobile_e164",
        existing_type=sa.String(16),
        nullable=True,
    )
    # Make mobile_verified_at nullable — password-only registration
    # (mobile or email) no longer requires OTP verification up front.
    op.alter_column(
        "patient_accounts", "mobile_verified_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=True,
    )
    # Add email
    op.add_column(
        "patient_accounts",
        sa.Column("email", sa.String(255), nullable=True),
    )
    op.create_index(
        "ix_patient_accounts_email",
        "patient_accounts", ["email"],
        unique=True,
    )
    # Add full name
    op.add_column(
        "patient_accounts",
        sa.Column("full_name", sa.String(150), nullable=True),
    )


def downgrade() -> None:
    op.drop_index("ix_patient_accounts_email", "patient_accounts")
    op.drop_column("patient_accounts", "email")
    op.drop_column("patient_accounts", "full_name")
    op.alter_column(
        "patient_accounts", "mobile_verified_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
    )
    op.alter_column(
        "patient_accounts", "mobile_e164",
        existing_type=sa.String(16),
        nullable=False,
    )