"""Refactor auth system - rename columns, add new fields

Revision ID: 002
Revises: 001
Create Date: 2026-08-18 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str]] = ()
depends_on: Union[str, Sequence[str]] = ()


def upgrade() -> None:
    # Drop old enum value BLOCKED and create SUSPENDED
    op.execute("ALTER TYPE userstatus RENAME VALUE 'BLOCKED' TO 'SUSPENDED'")

    # Rename hashed_password -> password_hash
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')

    # Rename google_subject -> google_id
    op.drop_index('ix_users_google_subject', table_name='users')
    op.drop_constraint('uq_users_google_subject', 'users', type_='unique')
    op.alter_column('users', 'google_subject', new_column_name='google_id')
    op.create_index('ix_users_google_id', 'users', ['google_id'])
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])

    # Replace email_verified_at (datetime) with email_verified (bool)
    op.drop_column('users', 'email_verified_at')
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))

    # Replace phone_verified_at (datetime) with phone_verified (bool)
    op.drop_column('users', 'phone_verified_at')
    op.add_column('users', sa.Column('phone_verified', sa.Boolean(), nullable=False, server_default='false'))

    # Add new columns
    op.add_column('users', sa.Column('profile_image', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'profile_image')

    op.drop_column('users', 'phone_verified')
    op.add_column('users', sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True))

    op.drop_column('users', 'email_verified')
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))

    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    op.alter_column('users', 'google_id', new_column_name='google_subject')
    op.create_index('ix_users_google_subject', 'users', ['google_subject'])
    op.create_unique_constraint('uq_users_google_subject', 'users', ['google_subject'])

    op.alter_column('users', 'password_hash', new_column_name='hashed_password')

    op.execute("ALTER TYPE userstatus RENAME VALUE 'SUSPENDED' TO 'BLOCKED'")
