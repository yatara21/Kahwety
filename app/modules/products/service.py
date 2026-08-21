from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductCreate, ProductUpdate
from app.modules.products.models import Product
from app.core.exceptions import NotFoundException


class ProductService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repository = ProductRepository(session)
    
    async def create_product(self, product_create: ProductCreate) -> Product:
        return await self.product_repository.create(product_create)
    
    async def get_product(self, product_id: str) -> Product:
        product = await self.product_repository.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")
        return product
    
    async def list_products_by_cafe(
        self,
        cafe_id: str,
        page: int = 1,
        page_size: int = 20,
        available_only: bool = False,
    ) -> tuple[List[Product], int]:
        return await self.product_repository.list_by_cafe(
            cafe_id, page, page_size, available_only
        )
    
    async def list_all_products(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Product], int]:
        return await self.product_repository.list_all(page, page_size)
    
    async def update_product(self, product_id: str, product_update: ProductUpdate) -> Product:
        product = await self.get_product(product_id)
        return await self.product_repository.update(product, product_update)
    
    async def delete_product(self, product_id: str) -> None:
        product = await self.get_product(product_id)
        await self.product_repository.delete(product)
