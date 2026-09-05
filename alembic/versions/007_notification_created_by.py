"""007 add created_by to notifications table

Revision ID: 007
Revises: 006
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa


revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("notifications")]

    if "created_by" not in columns:
        op.add_column(
            "notifications",
            sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("notifications")]

    if "created_by" in columns:
        op.drop_column("notifications", "created_by")
