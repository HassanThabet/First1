#!/usr/bin/env python3
"""
Script to clean up dead/orphan reports from the database.
Deletes reports where the user_id doesn't exist in the users collection.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def cleanup_dead_reports():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Starting cleanup of dead/orphan reports...")
    print(f"📊 Database: {DB_NAME}")
    print(f"🔗 MongoDB URL: {MONGO_URL}")
    print()
    
    # Get all valid user IDs
    users = await db.users.find({}, {"id": 1}).to_list(1000)
    valid_user_ids = set([user["id"] for user in users])
    print(f"✅ Found {len(valid_user_ids)} valid users in the system")
    print()
    
    # Report collections to check
    report_collections = [
        "supervisor_reports",
        "vice_principal_reports",
        "social_specialist_reports",
        "activities_reports",
        "quality_reports",
        "director_reports",
        "educational_supervision_reports"
    ]
    
    total_deleted = 0
    
    for collection_name in report_collections:
        collection = db[collection_name]
        
        # Find reports with invalid user_ids
        all_reports = await collection.find({}).to_list(10000)
        dead_reports = [r for r in all_reports if r.get("user_id") not in valid_user_ids]
        
        if dead_reports:
            print(f"🗑️  {collection_name}:")
            print(f"   Total reports: {len(all_reports)}")
            print(f"   Dead reports: {len(dead_reports)}")
            
            # Delete dead reports
            dead_ids = [r["id"] for r in dead_reports]
            result = await collection.delete_many({"id": {"$in": dead_ids}})
            print(f"   ✅ Deleted: {result.deleted_count}")
            total_deleted += result.deleted_count
        else:
            print(f"✅ {collection_name}: All reports are valid (Total: {len(all_reports)})")
        
        print()
    
    print("=" * 60)
    print(f"🎉 Cleanup completed!")
    print(f"📊 Total dead reports deleted: {total_deleted}")
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_dead_reports())
