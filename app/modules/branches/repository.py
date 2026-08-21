from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.modules.branches.models import Branch
from app.modules.branches.schemas import BranchCreate, BranchUpdate


class BranchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, branch_create: BranchCreate) -> Branch:
        branch = Branch(
            cafe_id=branch_create.cafe_id,
            name=branch_create.name,
            address=branch_create.address,
            latitude=branch_create.latitude,
            longitude=branch_create.longitude,
            place_id=branch_create.place_id,
            working_hours=branch_create.working_hours
        )
        self.session.add(branch)
        await self.session.flush()
        await self.session.refresh(branch)
        return branch
    
    async def get_by_id(self, branch_id: str) -> Optional[Branch]:
        result = await self.session.execute(select(Branch).where(Branch.id == branch_id))
        return result.scalar_one_or_none()
    
    async def list_by_cafe(
        self,
        cafe_id: str,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Branch], int]:
        query = select(Branch).where(Branch.cafe_id == cafe_id)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Branch.created_at.desc())
        
        result = await self.session.execute(query)
        branches = result.scalars().all()
        
        return list(branches), total
    
    async def update(self, branch: Branch, branch_update: BranchUpdate) -> Branch:
        if branch_update.name is not None:
            branch.name = branch_update.name
        if branch_update.address is not None:
            branch.address = branch_update.address
        if branch_update.latitude is not None:
            branch.latitude = branch_update.latitude
        if branch_update.longitude is not None:
            branch.longitude = branch_update.longitude
        if branch_update.place_id is not None:
            branch.place_id = branch_update.place_id
        if branch_update.working_hours is not None:
            branch.working_hours = branch_update.working_hours
        
        await self.session.flush()
        await self.session.refresh(branch)
        return branch
    
    async def delete(self, branch: Branch) -> None:
        await self.session.delete(branch)
        await self.session.flush()
