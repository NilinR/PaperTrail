from fastapi import FastAPI

from app.main import app as main_app

app = FastAPI()
app.mount("/", main_app)
