"""004 coupons table + subscription columns + plan features

Revision ID: 004
Revises: 003
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create coupons table
    op.create_table(
        "coupons",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("discount_percent", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.String(36), sa.ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Add payment_method and paid_amount to subscriptions
    op.add_column("subscriptions", sa.Column("payment_method", sa.String(50), nullable=True))
    op.add_column("subscriptions", sa.Column("paid_amount", sa.Numeric(10, 2), nullable=True))

    # Add features to subscription_plans
    op.add_column("subscription_plans", sa.Column("features", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("subscription_plans", "features")
    op.drop_column("subscriptions", "paid_amount")
    op.drop_column("subscriptions", "payment_method")
    op.drop_table("coupons")
