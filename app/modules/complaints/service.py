import logging
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.complaints.repository import ComplaintRepository
from app.modules.complaints.schemas import ComplaintCreate, ComplaintUpdate
from app.modules.complaints.models import Complaint
from app.modules.users.repository import UserRepository
from app.core.exceptions import NotFoundException
from app.services.sms import get_sms_provider
from app.common.enums import ComplaintStatus

logger = logging.getLogger(__name__)


class ComplaintService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.complaint_repository = ComplaintRepository(session)
        self.user_repository = UserRepository(session)

    async def create_complaint(self, complaint_create: ComplaintCreate) -> Complaint:
        return await self.complaint_repository.create(complaint_create)

    async def get_complaint(self, complaint_id: str) -> Complaint:
        complaint = await self.complaint_repository.get_by_id(complaint_id)
        if not complaint:
            raise NotFoundException("Complaint not found")
        return complaint

    async def list_complaints_by_customer(
        self,
        customer_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        status_enum = ComplaintStatus(status) if status else None
        return await self.complaint_repository.list_by_customer(customer_id, status_enum, page, page_size)

    async def list_complaints_by_cafe(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        status_enum = ComplaintStatus(status) if status else None
        return await self.complaint_repository.list_by_cafe(cafe_id, status_enum, page, page_size)

    async def list_all_complaints(
        self,
        status: Optional[str] = None,
        cafe_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        status_enum = ComplaintStatus(status) if status else None
        return await self.complaint_repository.list_all(status_enum, cafe_id, customer_id, page, page_size)

    async def update_complaint(self, complaint_id: str, complaint_update: ComplaintUpdate) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        updated = await self.complaint_repository.update(complaint, complaint_update)

        if updated.admin_response and updated.status == ComplaintStatus.NOTIFICATION_SENT:
            try:
                customer = await self.user_repository.get_by_id(updated.customer_id)
                if customer and customer.phone:
                    sms_provider = get_sms_provider()
                    message = (
                        f"Hello {customer.full_name},\n"
                        f"Regarding your complaint '{updated.subject}':\n"
                        f"{updated.admin_response}"
                    )
                    await sms_provider.send_sms(customer.phone, message)
            except Exception as exc:
                logger.exception("Failed to send complaint notification SMS: %s", exc)

        return updated

    async def send_notification(self, complaint_id: str, message: str) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        update = ComplaintUpdate(
            status=ComplaintStatus.NOTIFICATION_SENT,
            admin_response=message
        )
        updated = await self.complaint_repository.update(complaint, update)

        try:
            customer = await self.user_repository.get_by_id(updated.customer_id)
            if customer and customer.phone:
                sms_provider = get_sms_provider()
                await sms_provider.send_sms(customer.phone, message)
        except Exception as exc:
            logger.exception("Failed to send complaint notification SMS: %s", exc)

        return updated

    async def transfer_to_cafe(self, complaint_id: str) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        update = ComplaintUpdate(status=ComplaintStatus.TRANSFERRED_TO_CAFE)
        return await self.complaint_repository.update(complaint, update)

    async def resolve_complaint(self, complaint_id: str) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        update = ComplaintUpdate(status=ComplaintStatus.RESOLVED)
        return await self.complaint_repository.update(complaint, update)

    async def cafe_reply(self, complaint_id: str, reply: str) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        update = ComplaintUpdate(cafe_response=reply)
        return await self.complaint_repository.update(complaint, update)
