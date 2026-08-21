import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings


async def main() -> None:
    eng = create_async_engine(settings.database_url)
    async with eng.begin() as conn:
        rows = await conn.execute(
            text(
                """
                SELECT table_name FROM information_schema.tables
                WHERE table_schema='public'
                  AND (table_name LIKE '%subscription%' OR table_name='payments')
                ORDER BY 1
                """
            )
        )
        print("tables", [r[0] for r in rows])
        cols = await conn.execute(
            text(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name='subscription_plans'
                ORDER BY ordinal_position
                """
            )
        )
        print("plan_cols", [r[0] for r in cols])
        ver = await conn.execute(text("SELECT version_num FROM alembic_version"))
        print("alembic", [r[0] for r in ver])
    await eng.dispose()


if __name__ == "__main__":
    asyncio.run(main())
