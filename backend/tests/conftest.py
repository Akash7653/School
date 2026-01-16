import pytest
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

@pytest.fixture
def fresh_db():
    """Provide a fresh Motor client for tests; cleanup runs via anyio.run"""
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        pytest.skip("MONGO_URL not set in environment")
    client = AsyncIOMotorClient(mongo_url)
    test_db = client[os.environ.get('DB_NAME')]
    import server as server_mod
    server_mod.db = test_db
    try:
        yield
    finally:
        async def _cleanup():
            try:
                await test_db.users.delete_many({})
                await test_db.students.delete_many({})
                await test_db.classes.delete_many({})
                await test_db.sections.delete_many({})
                await test_db.fee_structures.delete_many({})
                await test_db.attendance.delete_many({})
                await test_db.marks.delete_many({})
                await test_db.fees.delete_many({})
                await test_db.payments.delete_many({})
            except Exception:
                pass
        import anyio
        anyio.run(_cleanup)
        client.close()


@pytest.fixture(scope="session")
def ac():
    """Provide a shared AsyncClient for tests. Use `asyncio.run` to close it at teardown."""
    from httpx import AsyncClient, ASGITransport
    import server as server_mod
    client = AsyncClient(transport=ASGITransport(app=server_mod.app), base_url="http://test")
    try:
        yield client
    finally:
        import asyncio
        asyncio.run(client.aclose())