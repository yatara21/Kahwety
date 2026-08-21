from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, product_create: ProductCreate) -> Product:
        product = Product(
            cafe_id=product_create.cafe_id,
            name=product_create.name,
            name_en=product_create.name_en,
            description=product_create.description,
            price=float(product_create.price),
            image_url=product_create.image_url,
            availability=product_create.availability
        )
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product
    
    async def get_by_id(self, product_id: str) -> Optional[Product]:
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()
    
    async def list_by_cafe(
        self,
        cafe_id: str,
        page: int = 1,
        page_size: int = 20,
        available_only: bool = False,
    ) -> tuple[List[Product], int]:
        query = select(Product).where(Product.cafe_id == cafe_id)

        if available_only:
            query = query.where(Product.availability.is_(True))
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Product.created_at.desc())
        
        result = await self.session.execute(query)
        products = result.scalars().all()
        
        return list(products), total
    
    async def list_all(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Product], int]:
        query = select(Product)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Product.created_at.desc())
        
        result = await self.session.execute(query)
        products = result.scalars().all()
        
        return list(products), total
    
    async def update(self, product: Product, product_update: ProductUpdate) -> Product:
        if product_update.name is not None:
            product.name = product_update.name
        if product_update.name_en is not None:
            product.name_en = product_update.name_en
        if product_update.description is not None:
            product.description = product_update.description
        if product_update.price is not None:
            product.price = float(product_update.price)
        if product_update.image_url is not None:
            product.image_url = product_update.image_url
        if product_update.availability is not None:
            product.availability = product_update.availability
        
        await self.session.flush()
        await self.session.refresh(product)
        return product
    
    async def delete(self, product: Product) -> None:
        await self.session.delete(product)
        await self.session.flush()
