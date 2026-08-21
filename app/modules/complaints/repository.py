from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from app.modules.complaints.models import Complaint
from app.modules.complaints.schemas import ComplaintCreate, ComplaintUpdate
from app.common.enums import ComplaintStatus


class ComplaintRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, complaint_create: ComplaintCreate) -> Complaint:
        complaint = Complaint(
            customer_id=complaint_create.customer_id,
            cafe_id=complaint_create.cafe_id,
            subject=complaint_create.subject,
            description=complaint_create.description,
            status=ComplaintStatus.PENDING
        )
        self.session.add(complaint)
        await self.session.flush()
        await self.session.refresh(complaint)
        return complaint
    
    async def get_by_id(self, complaint_id: str) -> Optional[Complaint]:
        result = await self.session.execute(select(Complaint).where(Complaint.id == complaint_id))
        return result.scalar_one_or_none()
    
    async def list_by_customer(
        self,
        customer_id: str,
        status: Optional[ComplaintStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        query = select(Complaint).where(Complaint.customer_id == customer_id)
        
        if status:
            query = query.where(Complaint.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Complaint.created_at.desc())
        
        result = await self.session.execute(query)
        complaints = result.scalars().all()
        
        return list(complaints), total
    
    async def list_by_cafe(
        self,
        cafe_id: str,
        status: Optional[ComplaintStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        query = select(Complaint).where(Complaint.cafe_id == cafe_id)
        
        if status:
            query = query.where(Complaint.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Complaint.created_at.desc())
        
        result = await self.session.execute(query)
        complaints = result.scalars().all()
        
        return list(complaints), total
    
    async def list_all(
        self,
        status: Optional[ComplaintStatus] = None,
        cafe_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        query = select(Complaint)
        
        if status:
            query = query.where(Complaint.status == status)
        if cafe_id:
            query = query.where(Complaint.cafe_id == cafe_id)
        if customer_id:
            query = query.where(Complaint.customer_id == customer_id)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Complaint.created_at.desc())
        
        result = await self.session.execute(query)
        complaints = result.scalars().all()
        
        return list(complaints), total
    
    async def update(self, complaint: Complaint, complaint_update: ComplaintUpdate) -> Complaint:
        if complaint_update.status is not None:
            complaint.status = complaint_update.status
        if complaint_update.admin_response is not None:
            complaint.admin_response = complaint_update.admin_response
        if complaint_update.cafe_response is not None:
            complaint.cafe_response = complaint_update.cafe_response
        
        await self.session.flush()
        await self.session.refresh(complaint)
        return complaint
