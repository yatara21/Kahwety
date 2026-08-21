"""Fix DB issues: missing updated_at on notifications, enum values mismatch."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text


async def fix():
    engine = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5432/cafe_platform")
    async with async_sessionmaker(engine, class_=AsyncSession)() as s:
        # 1. Add updated_at to notifications if missing
        print("Checking notifications.updated_at...")
        r = await s.execute(text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.columns "
            "WHERE table_name='notifications' AND column_name='updated_at')"
        ))
        if not r.scalar():
            print("  Adding updated_at column...")
            await s.execute(text(
                "ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL"
            ))
            print("  Done.")
        else:
            print("  Already exists.")

        # 2. Check current pagepermission enum values
        print("\nChecking pagepermission enum values...")
        r = await s.execute(text(
            "SELECT e.enumlabel FROM pg_type t "
            "JOIN pg_enum e ON t.oid = e.enumtypid "
            "WHERE t.typname = 'pagepermission'"
        ))
        db_values = [row[0] for row in r]
        print(f"  DB enum values: {db_values}")

        # 3. Check what the Python enum expects
        from app.common.enums import PagePermission
        py_values = [e.value for e in PagePermission]
        print(f"  Python enum values: {py_values}")
        py_names = [e.name for e in PagePermission]
        print(f"  Python enum names: {py_names}")

        # If DB has names but we need values, recreate the enum
        if set(db_values) != set(py_values):
            print("\n  Mismatch! Recreating enum type...")
            # First, drop the existing enum constraint
            await s.execute(text(
                "ALTER TABLE user_page_permissions DROP CONSTRAINT IF EXISTS uq_user_page_permission"
            ))
            await s.execute(text(
                "ALTER TABLE user_page_permissions DROP COLUMN IF EXISTS page"
            ))
            await s.execute(text("DROP TYPE IF EXISTS pagepermission CASCADE"))

            # Recreate with correct values
            enum_vals = ", ".join(f"'{v}'" for v in py_values)
            await s.execute(text(f"CREATE TYPE pagepermission AS ENUM ({enum_vals})"))
            await s.execute(text(
                "ALTER TABLE user_page_permissions ADD COLUMN page pagepermission NOT NULL"
            ))
            await s.execute(text(
                "ALTER TABLE user_page_permissions ADD CONSTRAINT uq_user_page_permission UNIQUE (user_id, page)"
            ))
            print("  Recreated with correct values.")
        else:
            print("  Enum values match. No action needed.")

        await s.commit()
    await engine.dispose()


asyncio.run(fix())
