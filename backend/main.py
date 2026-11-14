from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models

app = FastAPI(
    title="brainUp API",
    description="brainUp білім беру платформасының сервері",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kasko10.github.io"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    if engine is not None:
        Base.metadata.create_all(bind=engine)


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
