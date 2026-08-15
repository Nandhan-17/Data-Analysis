from fastapi import FastAPI

app = FastAPI(
    title="Portfolio API",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "Portfolio API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/test")
def test():
    return {
        "success": True,
        "message": "API is working correctly"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "data._processor:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )