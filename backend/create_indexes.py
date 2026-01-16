"""Run this script to create indexes for classes/sections/fee_structures.
Usage: python create_indexes.py
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_indexes():
    print('Creating indexes...')
    # unique class name
    await db.classes.create_index('name', unique=True)
    # unique section per class
    await db.sections.create_index([('class_id', 1), ('name', 1)], unique=True)
    # index fees by class_id
    await db.fee_structures.create_index('class_id')
    print('Indexes created')

if __name__ == '__main__':
    import asyncio
    asyncio.run(create_indexes())
