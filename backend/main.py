from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
from routers import auth, group, expense, balance, settlement
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SplitMint API")

# Global Error Handler to catch and return detailed errors for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "path": request.url.path
        }
    )

# Setup CORS to allow our React frontend to communicate with this backend
# We allow all origins in development and specific ones in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(group.router)
app.include_router(expense.router)
app.include_router(balance.router)
app.include_router(settlement.router)

@app.get("/health")
async def health_check():
    """Verifies that the API is running and the database is connected."""
    try:
        # Simple ping to the database
        from database.mongo import client
        await client.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "active"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.get("/")
def root():
    return {"message": "Welcome to SplitMint API. The engine is running."}
