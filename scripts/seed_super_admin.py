"""Seed script to create initial Super Admin user."""
import asyncio
import uuid
import bcrypt
from sqlalchemy import text
from app.core.database import async_session_maker


EMAIL = "admin@cafe.com"
PASSWORD = "Admin123!"
FULL_NAME = "Super Admin"


async def seed_super_admin():
    password_hash = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = str(uuid.uuid4())

    async with async_session_maker() as session:
        existing = await session.execute(
            text("SELECT id FROM users WHERE email = :email LIMIT 1"),
            {"email": EMAIL},
        )
        if existing.first():
            print(f"Super admin already exists: {EMAIL}")
            return

        await session.execute(
            text("""
                INSERT INTO users (id, role, full_name, email, password_hash, status, email_verified, phone_verified, created_at, updated_at)
                VALUES (:id, 'SUPER_ADMIN', :full_name, :email, :password_hash, 'ACTIVE', true, false, NOW(), NOW())
            """),
            {
                "id": user_id,
                "full_name": FULL_NAME,
                "email": EMAIL,
                "password_hash": password_hash,
            },
        )
        await session.commit()
        print(f"Super admin created: {EMAIL} / {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed_super_admin())
