"""Add Google Maps location fields to cafes and branches

Revision ID: 003
Revises: 002
Create Date: 2026-08-18 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str]] = ()
depends_on: Union[str, Sequence[str]] = ()


def upgrade() -> None:
    # Add place_id to cafes
    op.add_column('cafes', sa.Column('place_id', sa.String(255), nullable=True))

    # Add location fields to branches
    op.add_column('branches', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('branches', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('branches', sa.Column('place_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('branches', 'place_id')
    op.drop_column('branches', 'longitude')
    op.drop_column('branches', 'latitude')

    op.drop_column('cafes', 'place_id')