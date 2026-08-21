from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.dashboard.service import DashboardService
from app.modules.dashboard.schemas import DashboardResponse
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=SuccessResponse[DashboardResponse])
async def get_dashboard(
    current_user = Depends(require_page_permission(PagePermission.DASHBOARD)),
    session: AsyncSession = Depends(get_async_session)
):
    service = DashboardService(session)
    dashboard = await service.get_dashboard_stats()
    return SuccessResponse(data=dashboard)
