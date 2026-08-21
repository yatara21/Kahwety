"""Quick DB diagnostics."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text


async def check():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/cafe_platform")
    async with async_sessionmaker(engine, class_=AsyncSession)() as s:
        q1 = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='notifications')"
        r = await s.execute(text(q1))
        print("notifications table:", r.scalar())

        q2 = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='user_page_permissions')"
        r = await s.execute(text(q2))
        print("user_page_permissions table:", r.scalar())

        q3 = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position"
        r = await s.execute(text(q3))
        for row in r:
            print(f"  notifications.{row[0]}: {row[1]}")

        q4 = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='user_page_permissions' ORDER BY ordinal_position"
        r = await s.execute(text(q4))
        for row in r:
            print(f"  user_page_permissions.{row[0]}: {row[1]}")

        q5 = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
        r = await s.execute(text(q5))
        for row in r:
            print(f"  users.{row[0]}: {row[1]}")

    await engine.dispose()


asyncio.run(check())
