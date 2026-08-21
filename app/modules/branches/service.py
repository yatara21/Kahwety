from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.branches.repository import BranchRepository
from app.modules.branches.schemas import BranchCreate, BranchUpdate
from app.modules.branches.models import Branch
from app.core.exceptions import NotFoundException


class BranchService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.branch_repository = BranchRepository(session)
    
    async def create_branch(self, branch_create: BranchCreate) -> Branch:
        return await self.branch_repository.create(branch_create)
    
    async def get_branch(self, branch_id: str) -> Branch:
        branch = await self.branch_repository.get_by_id(branch_id)
        if not branch:
            raise NotFoundException("Branch not found")
        return branch
    
    async def list_branches_by_cafe(
        self,
        cafe_id: str,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Branch], int]:
        return await self.branch_repository.list_by_cafe(cafe_id, page, page_size)
    
    async def update_branch(self, branch_id: str, branch_update: BranchUpdate) -> Branch:
        branch = await self.get_branch(branch_id)
        return await self.branch_repository.update(branch, branch_update)
    
    async def delete_branch(self, branch_id: str) -> None:
        branch = await self.get_branch(branch_id)
        await self.branch_repository.delete(branch)
