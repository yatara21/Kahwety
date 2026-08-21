import pytest
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.common.enums import UserRole, UserStatus
from app.core.exceptions import NotFoundException


@pytest.mark.asyncio
async def test_user_repository_create(test_session, test_user_data):
    """Test user creation in repository."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await repo.create(user_create)
    
    assert user.id is not None
    assert user.email == test_user_data["email"]
    assert user.role == UserRole.CUSTOMER
    assert user.status == UserStatus.ACTIVE


@pytest.mark.asyncio
async def test_user_repository_get_by_id(test_session, test_user_data):
    """Test getting user by ID."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await repo.create(user_create)
    retrieved_user = await repo.get_by_id(user.id)
    
    assert retrieved_user is not None
    assert retrieved_user.id == user.id
    assert retrieved_user.email == user.email


@pytest.mark.asyncio
async def test_user_repository_get_by_email(test_session, test_user_data):
    """Test getting user by email."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await repo.create(user_create)
    retrieved_user = await repo.get_by_email(user.email)
    
    assert retrieved_user is not None
    assert retrieved_user.id == user.id


@pytest.mark.asyncio
async def test_user_repository_email_exists(test_session, test_user_data):
    """Test email existence check."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    await repo.create(user_create)
    
    # Email should exist
    assert await repo.email_exists(test_user_data["email"]) is True
    
    # Different email should not exist
    assert await repo.email_exists("different@example.com") is False


@pytest.mark.asyncio
async def test_user_repository_update(test_session, test_user_data):
    """Test user update."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await repo.create(user_create)
    
    from app.modules.users.schemas import UserUpdate
    user_update = UserUpdate(
        full_name="Updated Name",
        status=UserStatus.INACTIVE
    )
    
    updated_user = await repo.update(user, user_update)
    
    assert updated_user.full_name == "Updated Name"
    assert updated_user.status == UserStatus.INACTIVE


@pytest.mark.asyncio
async def test_user_repository_delete(test_session, test_user_data):
    """Test user deletion."""
    repo = UserRepository(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await repo.create(user_create)
    await repo.delete(user)
    
    # User should not exist after deletion
    retrieved_user = await repo.get_by_id(user.id)
    assert retrieved_user is None


@pytest.mark.asyncio
async def test_user_repository_list_by_role(test_session, test_user_data):
    """Test listing users by role."""
    repo = UserRepository(test_session)
    
    # Create multiple users
    for i in range(3):
        user_create = UserCreate(
            role=UserRole.CUSTOMER,
            full_name=f"Customer {i}",
            email=f"customer{i}@example.com",
            phone=f"+123456789{i}",
            password="Password123!"
        )
        await repo.create(user_create)
    
    users, total = await repo.list_by_role(UserRole.CUSTOMER)
    
    assert total >= 3
    assert len(users) >= 3
    assert all(u.role == UserRole.CUSTOMER for u in users)
