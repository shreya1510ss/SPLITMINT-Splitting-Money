from fastapi import FastAPI
from routers import auth, group, expense, balance, settlement
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SplitMint API")

# Setup CORS to allow our React frontend to communicate with this backend
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

@app.get("/")
def root():
    return {"message": "Welcome to SplitMint API. The engine is running."}
