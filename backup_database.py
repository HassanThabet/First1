"""
Script to backup all database collections to JSON files
"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def backup_database():
    """Backup all collections from MongoDB to JSON files"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create backup directory
    backup_dir = Path(__file__).parent / "database_backup"
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Get all collection names
    collection_names = await db.list_collection_names()
    
    print(f"📦 Starting database backup...")
    print(f"📁 Database: {db_name}")
    print(f"📋 Collections found: {len(collection_names)}")
    print("-" * 50)
    
    backup_summary = {
        "timestamp": timestamp,
        "database": db_name,
        "collections": {}
    }
    
    # Backup each collection
    for collection_name in collection_names:
        collection = db[collection_name]
        
        # Get all documents
        documents = await collection.find().to_list(length=None)
        
        # Convert ObjectId to string if present
        for doc in documents:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
        
        # Save to JSON file
        filename = f"{collection_name}_{timestamp}.json"
        filepath = backup_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(documents, f, ensure_ascii=False, indent=2)
        
        backup_summary["collections"][collection_name] = {
            "filename": filename,
            "document_count": len(documents)
        }
        
        print(f"✅ {collection_name}: {len(documents)} documents backed up")
    
    # Save backup summary
    summary_file = backup_dir / f"backup_summary_{timestamp}.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(backup_summary, f, ensure_ascii=False, indent=2)
    
    print("-" * 50)
    print(f"✅ Backup completed successfully!")
    print(f"📁 Backup location: {backup_dir}")
    print(f"📄 Summary file: {summary_file.name}")
    
    client.close()
    
    return backup_dir

if __name__ == "__main__":
    asyncio.run(backup_database())
