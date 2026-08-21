"""005 product name_en, offer/event image_url, complaint cafe_response, suggested_cafes table

Revision ID: 005
Revises: 004
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add name_en to products
    op.add_column("products", sa.Column("name_en", sa.String(255), nullable=True))

    # Add image_url to offers
    op.add_column("offers", sa.Column("image_url", sa.String(500), nullable=True))

    # Add image_url to events
    op.add_column("events", sa.Column("image_url", sa.String(500), nullable=True))

    # Add cafe_response to complaints
    op.add_column("complaints", sa.Column("cafe_response", sa.Text(), nullable=True))

    # Extend the native complaintstatus enum with the two new values
    op.execute("ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'NOTIFICATION_SENT'")
    op.execute("ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'TRANSFERRED_TO_CAFE'")

    # Create suggested_cafes table (create_table creates the enum type itself)
    suggested_cafe_status = sa.Enum(
        "NEW", "SENT", "APPROVED", "REJECTED",
        name="suggestedcafestatus",
    )
    op.create_table(
        "suggested_cafes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_name", sa.String(255), nullable=False),
        sa.Column("city", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("google_link", sa.String(500), nullable=True),
        sa.Column("status", suggested_cafe_status, nullable=False, server_default="NEW"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("facebook", sa.String(500), nullable=True),
        sa.Column("instagram", sa.String(500), nullable=True),
        sa.Column("telegram", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("suggested_cafes")
    op.execute("DROP TYPE IF EXISTS suggestedcafestatus")
    op.drop_column("complaints", "cafe_response")
    op.drop_column("events", "image_url")
    op.drop_column("offers", "image_url")
    op.drop_column("products", "name_en")