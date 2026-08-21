import pytest
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.cafes.service import CafeService
from app.modules.cafes.schemas import CafeCreate, CafeApprovalRequest
from app.common.enums import UserRole, CafeRegistrationStatus
from app.core.exceptions import ConflictException, BusinessException


@pytest.mark.asyncio
async def test_user_service_create(test_session, test_user_data):
    """Test user creation in service layer."""
    service = UserService(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    user = await service.create_user(user_create)
    
    assert user.id is not None
    assert user.email == test_user_data["email"]
    assert user.role == UserRole.CUSTOMER


@pytest.mark.asyncio
async def test_user_service_duplicate_email(test_session, test_user_data):
    """Test that duplicate email creation fails in service."""
    service = UserService(test_session)
    
    user_create = UserCreate(
        role=UserRole.CUSTOMER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    
    await service.create_user(user_create)
    
    # Try to create again with same email
    with pytest.raises(ConflictException):
        await service.create_user(user_create)


@pytest.mark.asyncio
async def test_cafe_service_create(test_session, test_user_data):
    """Test cafe creation in service layer."""
    from app.modules.users.service import UserService
    from app.modules.users.schemas import UserCreate
    
    # Create a cafe owner first
    user_service = UserService(test_session)
    user_create = UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"]
    )
    owner = await user_service.create_user(user_create)
    
    # Create cafe
    cafe_service = CafeService(test_session)
    cafe_create = CafeCreate(
        name="Test Cafe",
        description="A test cafe",
        address="123 Main St"
    )
    
    cafe = await cafe_service.create_cafe(cafe_create, owner.id)
    
    assert cafe.id is not None
    assert cafe.name == "Test Cafe"
    assert cafe.registration_status == CafeRegistrationStatus.PENDING


@pytest.mark.asyncio
async def test_cafe_service_approve(test_session, test_user_data):
    """Test cafe approval workflow."""
    from app.modules.users.service import UserService
    from app.modules.users.schemas import UserCreate
    
    # Create cafe owner
    user_service = UserService(test_session)
    owner_create = UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Cafe Owner",
        email="owner@example.com",
        phone="+1234567890",
        password="Password123!"
    )
    owner = await user_service.create_user(owner_create)
    
    # Create admin for approval
    admin_create = UserCreate(
        role=UserRole.ADMIN,
        full_name="Admin",
        email="admin@example.com",
        phone="+1234567891",
        password="Password123!"
    )
    admin = await user_service.create_user(admin_create)
    
    # Create cafe
    cafe_service = CafeService(test_session)
    cafe_create = CafeCreate(
        name="Test Cafe",
        description="A test cafe",
        address="123 Main St"
    )
    cafe = await cafe_service.create_cafe(cafe_create, owner.id)
    
    # Approve cafe
    approved_cafe = await cafe_service.approve_cafe(cafe.id, admin.id)
    
    assert approved_cafe.registration_status == CafeRegistrationStatus.APPROVED
    assert approved_cafe.approved_by == admin.id


@pytest.mark.asyncio
async def test_cafe_service_reject(test_session, test_user_data):
    """Test cafe rejection workflow."""
    from app.modules.users.service import UserService
    from app.modules.users.schemas import UserCreate
    
    # Create cafe owner
    user_service = UserService(test_session)
    owner_create = UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Cafe Owner",
        email="owner@example.com",
        phone="+1234567890",
        password="Password123!"
    )
    owner = await user_service.create_user(owner_create)
    
    # Create cafe
    cafe_service = CafeService(test_session)
    cafe_create = CafeCreate(
        name="Test Cafe",
        description="A test cafe",
        address="123 Main St"
    )
    cafe = await cafe_service.create_cafe(cafe_create, owner.id)
    
    # Reject cafe
    rejected_cafe = await cafe_service.reject_cafe(cafe.id)
    
    assert rejected_cafe.registration_status == CafeRegistrationStatus.REJECTED


@pytest.mark.asyncio
async def test_cafe_service_approve_already_approved(test_session, test_user_data):
    """Test that approving an already approved cafe fails."""
    from app.modules.users.service import UserService
    from app.modules.users.schemas import UserCreate
    
    # Create cafe owner and admin
    user_service = UserService(test_session)
    owner = await user_service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Owner",
        email="owner@example.com",
        phone="+1234567890",
        password="Password123!"
    ))
    admin = await user_service.create_user(UserCreate(
        role=UserRole.ADMIN,
        full_name="Admin",
        email="admin@example.com",
        phone="+1234567891",
        password="Password123!"
    ))
    
    # Create and approve cafe
    cafe_service = CafeService(test_session)
    cafe_create = CafeCreate(
        name="Test Cafe",
        description="A test cafe",
        address="123 Main St"
    )
    cafe = await cafe_service.create_cafe(cafe_create, owner.id)
    await cafe_service.approve_cafe(cafe.id, admin.id)
    
    # Try to approve again
    with pytest.raises(BusinessException):
        await cafe_service.approve_cafe(cafe.id, admin.id)


@pytest.mark.asyncio
async def test_cafe_service_reject_approved_cafe(test_session, test_user_data):
    """Test that rejecting an approved cafe fails."""
    from app.modules.users.service import UserService
    from app.modules.users.schemas import UserCreate
    
    # Create cafe owner and admin
    user_service = UserService(test_session)
    owner = await user_service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Owner",
        email="owner@example.com",
        phone="+1234567890",
        password="Password123!"
    ))
    admin = await user_service.create_user(UserCreate(
        role=UserRole.ADMIN,
        full_name="Admin",
        email="admin@example.com",
        phone="+1234567891",
        password="Password123!"
    ))
    
    # Create and approve cafe
    cafe_service = CafeService(test_session)
    cafe_create = CafeCreate(
        name="Test Cafe",
        description="A test cafe",
        address="123 Main St"
    )
    cafe = await cafe_service.create_cafe(cafe_create, owner.id)
    await cafe_service.approve_cafe(cafe.id, admin.id)
    
    # Try to reject approved cafe
    with pytest.raises(BusinessException):
        await cafe_service.reject_cafe(cafe.id)


@pytest.mark.asyncio
async def test_user_service_update_with_conflict(test_session, test_user_data):
    """Test user update with email conflict."""
    service = UserService(test_session)
    
    # Create two users
    user1 = await service.create_user(UserCreate(
        role=UserRole.CUSTOMER,
        full_name="User 1",
        email="user1@example.com",
        phone="+1234567890",
        password="Password123!"
    ))
    user2 = await service.create_user(UserCreate(
        role=UserRole.CUSTOMER,
        full_name="User 2",
        email="user2@example.com",
        phone="+1234567891",
        password="Password123!"
    ))
    
    # Try to update user1 with user2's email
    with pytest.raises(ConflictException):
        await service.update_user(user1.id, UserUpdate(email="user2@example.com"))
