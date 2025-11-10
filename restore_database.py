#!/usr/bin/env python3
"""
Script to restore MongoDB database from JSON backup files
"""
import json
import os
from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['test_database']

# Backup directory
backup_dir = '/app/database_backup'
timestamp = '20251110_184654'

# Collection mappings
collections = {
    'users': f'users_{timestamp}.json',
    'teachers': f'teachers_{timestamp}.json',
    'subjects': f'subjects_{timestamp}.json',
    'classrooms': f'classrooms_{timestamp}.json',
    'supervisor_reports': f'supervisor_reports_{timestamp}.json',
    'vice_principal_reports': f'vice_principal_reports_{timestamp}.json',
    'activities_reports': f'activities_reports_{timestamp}.json',
    'social_specialist_reports': f'social_specialist_reports_{timestamp}.json',
    'quality_reports': f'quality_reports_{timestamp}.json',
    'educational_supervision_reports': f'educational_supervision_reports_{timestamp}.json',
    'director_reports': f'director_reports_{timestamp}.json',
    'sessions': f'sessions_{timestamp}.json'
}

def restore_collection(collection_name, filename):
    """Restore a single collection from JSON file"""
    filepath = os.path.join(backup_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return 0
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"⚠️  {collection_name}: No data to restore")
            return 0
        
        # Clear existing data
        db[collection_name].delete_many({})
        
        # Insert data
        if isinstance(data, list):
            result = db[collection_name].insert_many(data)
            count = len(result.inserted_ids)
        else:
            result = db[collection_name].insert_one(data)
            count = 1
        
        print(f"✅ {collection_name}: Restored {count} documents")
        return count
        
    except Exception as e:
        print(f"❌ Error restoring {collection_name}: {str(e)}")
        return 0

def main():
    print("=" * 60)
    print("🔄 Starting Database Restoration")
    print("=" * 60)
    print(f"Database: test_database")
    print(f"Backup timestamp: {timestamp}")
    print("=" * 60)
    
    total_restored = 0
    
    # Skip sessions as they are temporary
    skip_collections = ['sessions']
    
    for collection_name, filename in collections.items():
        if collection_name in skip_collections:
            print(f"⏭️  {collection_name}: Skipped (temporary data)")
            continue
            
        count = restore_collection(collection_name, filename)
        total_restored += count
    
    print("=" * 60)
    print(f"✅ Restoration Complete!")
    print(f"Total documents restored: {total_restored}")
    print("=" * 60)
    
    # Verify restoration
    print("\n📊 Database Status:")
    for collection_name in collections.keys():
        if collection_name not in skip_collections:
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")

if __name__ == "__main__":
    main()
