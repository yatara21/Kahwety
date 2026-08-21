"""Add updated_at to notifications."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

async def fix():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/cafe_platform")
    async with async_sessionmaker(engine, class_=AsyncSession)() as s:
        await s.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"))
        await s.commit()
        r = await s.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position"))
        for row in r:
            print(row[0])
    await engine.dispose()

asyncio.run(fix())
