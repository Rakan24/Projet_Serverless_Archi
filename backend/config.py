from dotenv import load_dotenv
import os

# Charge les variables depuis le fichier .env
load_dotenv()

class Config:
    AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
    AZURE_STORAGE_ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
    AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
