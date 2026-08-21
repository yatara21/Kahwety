"""006 moyasar user subscriptions and payments

Revision ID: 006
Revises: 005
Create Date: 2026-08-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    subscriber_type = postgresql.ENUM("CUSTOMER", "CAFE_OWNER", name="subscriber_type", create_type=False)
    billing_cycle = postgresql.ENUM("MONTHLY", "ANNUAL", name="billing_cycle", create_type=False)
    payment_status = postgresql.ENUM("PENDING", "PAID", "FAILED", name="paymentstatus", create_type=False)
    subscription_status = postgresql.ENUM(
        "ACTIVE", "EXPIRED", "CANCELLED", "PENDING", name="subscriptionstatus", create_type=False
    )

    op.execute("DO $$ BEGIN CREATE TYPE subscriber_type AS ENUM ('CUSTOMER', 'CAFE_OWNER'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'ANNUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE paymentstatus AS ENUM ('PENDING', 'PAID', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    plan_columns = {col["name"] for col in inspector.get_columns("subscription_plans")}

    if "description" not in plan_columns:
        op.add_column("subscription_plans", sa.Column("description", sa.Text(), nullable=True))
    if "subscriber_type" not in plan_columns:
        op.add_column("subscription_plans", sa.Column("subscriber_type", subscriber_type, nullable=True))
    if "billing_cycle" not in plan_columns:
        op.add_column("subscription_plans", sa.Column("billing_cycle", billing_cycle, nullable=True))
    if "currency" not in plan_columns:
        op.add_column(
            "subscription_plans",
            sa.Column("currency", sa.String(length=3), nullable=False, server_default="SAR"),
        )

    op.execute(
        """
        UPDATE subscription_plans
        SET subscriber_type = 'CAFE_OWNER'::subscriber_type,
            billing_cycle = CASE
                WHEN duration_days >= 365 THEN 'ANNUAL'::billing_cycle
                ELSE 'MONTHLY'::billing_cycle
            END
        WHERE subscriber_type IS NULL
        """
    )
    op.alter_column("subscription_plans", "subscriber_type", nullable=False)
    op.alter_column("subscription_plans", "billing_cycle", nullable=False)

    plan_columns = {col["name"] for col in sa.inspect(bind).get_columns("subscription_plans")}
    if "features" in plan_columns:
        op.drop_column("subscription_plans", "features")

    existing_indexes = {idx["name"] for idx in sa.inspect(bind).get_indexes("subscription_plans")}
    if "ix_subscription_plans_subscriber_type" not in existing_indexes:
        op.create_index("ix_subscription_plans_subscriber_type", "subscription_plans", ["subscriber_type"])
    if "ix_subscription_plans_billing_cycle" not in existing_indexes:
        op.create_index("ix_subscription_plans_billing_cycle", "subscription_plans", ["billing_cycle"])

    tables = set(sa.inspect(bind).get_table_names())

    if "subscriptions" in tables and "subscriptions_legacy" not in tables:
        # Detect legacy cafe-based schema
        sub_cols = {c["name"] for c in sa.inspect(bind).get_columns("subscriptions")}
        if "cafe_id" in sub_cols:
            op.rename_table("subscriptions", "subscriptions_legacy")
            tables = set(sa.inspect(bind).get_table_names())

    if "subscriptions" not in tables:
        op.create_table(
            "subscriptions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column(
                "plan_id",
                sa.String(length=36),
                sa.ForeignKey("subscription_plans.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("status", subscription_status, nullable=False),
            sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
        op.create_index("ix_subscriptions_plan_id", "subscriptions", ["plan_id"])
        op.create_index("ix_subscriptions_status", "subscriptions", ["status"])

    tables = set(sa.inspect(bind).get_table_names())
    if "subscriptions_legacy" in tables:
        op.execute(
            """
            INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, expires_at, created_at, updated_at)
            SELECT
                sl.id,
                c.owner_id,
                sl.plan_id,
                sl.status,
                sl.start_date,
                sl.expiration_date,
                sl.created_at,
                sl.updated_at
            FROM subscriptions_legacy sl
            JOIN cafes c ON c.id = sl.cafe_id
            ON CONFLICT (id) DO NOTHING
            """
        )
        op.drop_table("subscriptions_legacy")

    tables = set(sa.inspect(bind).get_table_names())
    if "payments" not in tables:
        op.create_table(
            "payments",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column(
                "subscription_id",
                sa.String(length=36),
                sa.ForeignKey("subscriptions.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("moyasar_payment_id", sa.String(length=64), nullable=True),
            sa.Column("amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default="SAR"),
            sa.Column("status", payment_status, nullable=False),
            sa.Column("payment_method", sa.String(length=50), nullable=True),
            sa.Column("payment_url", sa.String(length=1000), nullable=True),
            sa.Column("metadata", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("moyasar_payment_id"),
        )
        op.create_index("ix_payments_user_id", "payments", ["user_id"])
        op.create_index("ix_payments_subscription_id", "payments", ["subscription_id"])
        op.create_index("ix_payments_moyasar_payment_id", "payments", ["moyasar_payment_id"])
        op.create_index("ix_payments_status", "payments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_moyasar_payment_id", table_name="payments")
    op.drop_index("ix_payments_subscription_id", table_name="payments")
    op.drop_index("ix_payments_user_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_subscriptions_status", table_name="subscriptions")
    op.drop_index("ix_subscriptions_plan_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("cafe_id", sa.String(length=36), sa.ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.String(length=36), sa.ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "ACTIVE", "EXPIRED", "CANCELLED", "PENDING", name="subscriptionstatus", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("renewal_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expiration_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("paid_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("cafe_id", name="uq_subscriptions_cafe_id"),
    )

    op.drop_index("ix_subscription_plans_billing_cycle", table_name="subscription_plans")
    op.drop_index("ix_subscription_plans_subscriber_type", table_name="subscription_plans")
    op.drop_column("subscription_plans", "currency")
    op.drop_column("subscription_plans", "billing_cycle")
    op.drop_column("subscription_plans", "subscriber_type")
    op.drop_column("subscription_plans", "description")
    op.add_column("subscription_plans", sa.Column("features", sa.JSON(), nullable=True))

    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS billing_cycle")
    op.execute("DROP TYPE IF EXISTS subscriber_type")
