import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base

# Register all models on Base.metadata
import app.modules.users.models  # noqa: F401
import app.modules.admins.models  # noqa: F401
import app.modules.auth.models  # noqa: F401
import app.modules.cafes.models  # noqa: F401
import app.modules.branches.models  # noqa: F401
import app.modules.products.models  # noqa: F401
import app.modules.offers.models  # noqa: F401
import app.modules.events.models  # noqa: F401
import app.modules.complaints.models  # noqa: F401
import app.modules.subscription_plans.models  # noqa: F401
import app.modules.subscriptions.models  # noqa: F401
import app.modules.payments.models  # noqa: F401
import app.modules.coupons.models  # noqa: F401
import app.modules.notifications.models  # noqa: F401
import app.modules.suggested_cafes.models  # noqa: F401
import app.modules.customers.models  # noqa: F401


# Test database URL (use SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "+1234567890",
        "password": "TestPassword123!",
    }


@pytest.fixture
def test_admin_data():
    """Sample admin data for testing."""
    return {
        "full_name": "Test Admin",
        "email": "admin@example.com",
        "phone": "+1234567891",
        "password": "AdminPassword123!",
    }
