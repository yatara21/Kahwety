"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2026-08-03 01:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str]] = ()
depends_on: Union[str, Sequence[str]] = ()


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('role', sa.Enum('CUSTOMER', 'CAFE_OWNER', 'ADMIN', 'SUPER_ADMIN', name='userrole'), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'BLOCKED', name='userstatus'), nullable=False),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('google_subject', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_users_email'),
        sa.UniqueConstraint('phone', name='uq_users_phone'),
        sa.UniqueConstraint('google_subject', name='uq_users_google_subject')
    )
    op.create_index('ix_users_role', 'users', ['role'])
    op.create_index('ix_users_status', 'users', ['status'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_phone', 'users', ['phone'])
    op.create_index('ix_users_google_subject', 'users', ['google_subject'])
    op.create_index('ix_users_role_status', 'users', ['role', 'status'])

    # Create user_page_permissions table
    op.create_table(
        'user_page_permissions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('page', sa.Enum('Dashboard', 'Customers', 'Cafe Owners', 'Cafes', 'Products', 'Offers', 'Events', 'Subscriptions', 'Complaints', 'Notifications', 'Admins', name='pagepermission'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'page', name='uq_user_page_permission')
    )
    op.create_index('ix_user_page_permissions_user_id', 'user_page_permissions', ['user_id'])

    # Create customer_statistics table
    op.create_table(
        'customer_statistics',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('total_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cancelled_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_spent', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id')
    )

    # Create cafes table
    op.create_table(
        'cafes',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('owner_id', sa.String(36), nullable=False),
        sa.Column('approved_by', sa.String(36), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=False),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('registration_status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='caferegistrationstatus'), nullable=False),
        sa.Column('registration_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('working_hours', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('ix_cafes_owner_id', 'cafes', ['owner_id'])
    op.create_index('ix_cafes_approved_by', 'cafes', ['approved_by'])
    op.create_index('ix_cafes_registration_status', 'cafes', ['registration_status'])

    # Create branches table
    op.create_table(
        'branches',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('working_hours', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE')
    )

    # Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('availability', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE')
    )

    # Create offers table
    op.create_table(
        'offers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=False),
        sa.Column('discount_percentage', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'ACTIVE', 'EXPIRED', 'DISABLED', name='offerstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE')
    )

    # Create events table
    op.create_table(
        'events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=False),
        sa.Column('location', sa.String(500), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', name='eventstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE')
    )

    # Create complaints table
    op.create_table(
        'complaints',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('customer_id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('description', sa.String(2000), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'RESOLVED', name='complaintstatus'), nullable=False),
        sa.Column('admin_response', sa.String(2000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE')
    )

    # Create subscription_plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('cafe_id', sa.String(36), nullable=False),
        sa.Column('plan_id', sa.String(36), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', name='subscriptionstatus'), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('renewal_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expiration_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['cafe_id'], ['cafes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('cafe_id', name='uq_subscriptions_cafe_id')
    )

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.String(2000), nullable=False),
        sa.Column('target_type', sa.Enum('ALL', 'CUSTOMER', 'CAFE_OWNER', 'CAFE', 'USER', name='notificationtargettype'), nullable=False),
        sa.Column('target_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('token')
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'])


def downgrade() -> None:
    op.drop_index('ix_refresh_tokens_token', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    
    op.drop_table('notifications')
    
    op.drop_index('uq_subscriptions_cafe_id', table_name='subscriptions')
    op.drop_table('subscriptions')
    
    op.drop_table('subscription_plans')
    
    op.drop_table('complaints')
    
    op.drop_table('events')
    
    op.drop_table('offers')
    
    op.drop_table('products')
    
    op.drop_table('branches')
    
    op.drop_index('ix_cafes_registration_status', table_name='cafes')
    op.drop_index('ix_cafes_approved_by', table_name='cafes')
    op.drop_index('ix_cafes_owner_id', table_name='cafes')
    op.drop_table('cafes')
    
    op.drop_table('customer_statistics')
    
    op.drop_index('uq_user_page_permission', table_name='user_page_permissions')
    op.drop_index('ix_user_page_permissions_user_id', table_name='user_page_permissions')
    op.drop_table('user_page_permissions')
    
    op.drop_index('ix_users_role_status', table_name='users')
    op.drop_index('ix_users_google_subject', table_name='users')
    op.drop_index('ix_users_phone', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_status', table_name='users')
    op.drop_index('ix_users_role', table_name='users')
    op.drop_constraint('uq_users_google_subject', 'users')
    op.drop_constraint('uq_users_phone', 'users')
    op.drop_constraint('uq_users_email', 'users')
    op.drop_table('users')
