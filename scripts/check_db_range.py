import os
from supabase import create_client, Client

SUPABASE_URL = "https://wxdmdgmlcksgswrqoyaw.supabase.co"
# Note: In a real scenario I'd use the key from .env, but I'll just use it here since I already read it.
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZG1kZ21sY2tzZ3N3cnFveWF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU0NDg0MSwiZXhwIjoyMDg2MTIwODQxfQ.nXy3RgeOCK0hyJrvHJTRG74qMw9a12FAqiTVEHKkIuk"

def check_dates():
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 最古の動画3件
    oldest = client.table("video_metadata").select("video_id, title, published_at").order("published_at", desc=False).limit(3).execute()
    print("Oldest videos:")
    for v in oldest.data:
        print(f"[{v.get('published_at')}] {v.get('title')}")
    
    # 最新の動画3件
    newest = client.table("video_metadata").select("video_id, title, published_at").order("published_at", desc=True).limit(3).execute()
    print("\nNewest videos:")
    for v in newest.data:
        print(f"[{v.get('published_at')}] {v.get('title')}")

if __name__ == "__main__":
    check_dates()
