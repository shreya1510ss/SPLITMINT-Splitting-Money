from fastapi import FastAPI
from database.mongo import database
import os

app = FastAPI()

@app.get("/test-db")
async def test_db():
    try:
        # Try to count documents in a collection to verify connection
        count = await database.users.count_documents({})
        return {
            "status": "success",
            "message": "Connected to MongoDB Atlas!",
            "user_count": count,
            "mongo_url_configured": "MONGO_URL" in os.environ
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
