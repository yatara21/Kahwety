"""Verify notifications table columns."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/cafe_platform")
    async with async_sessionmaker(engine, class_=AsyncSession)() as s:
        r = await s.execute(text(
            "SELECT column_name, data_type, is_nullable "
            "FROM information_schema.columns "
            "WHERE table_name='notifications' ORDER BY ordinal_position"
        ))
        for row in r:
            print(f"  {row[0]}: {row[1]}, nullable={row[2]}")
    await engine.dispose()

asyncio.run(check())
