from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="brainUp API",
    description="brainUp білім беру платформасының сервері",
    version="1.0.0"
)

# Frontend-пен байланыс
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kasko10.github.io"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

@app.get("/")
def home():
    return {
        "message": "brainUp сервері жұмыс істеп тұр!",
        "status": "online"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "platform": "brainUp"
    }
