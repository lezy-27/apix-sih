import pytest
import pytest_asyncio
from app.database import init_db, AsyncSessionLocal
from app.services.seeder import seed_database_if_empty

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database_if_empty(session)
    yield
