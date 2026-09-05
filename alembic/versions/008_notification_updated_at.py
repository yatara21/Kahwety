"""008 add updated_at to notifications table

Revision ID: 008
Revises: 007
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa


revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("notifications")]

    if "updated_at" not in columns:
        op.add_column(
            "notifications",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("notifications")]

    if "updated_at" in columns:
        op.drop_column("notifications", "updated_at")
