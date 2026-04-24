"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central config — all values from env, never hardcoded."""

    KAGGLE_USERNAME: str = os.getenv("KAGGLE_USERNAME", "")
    KAGGLE_KEY: str = os.getenv("KAGGLE_KEY", "")
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", 5000))

    KAGGLE_DATASETS: dict = {
        "titanic": "heptapod/titanic",
        "happiness": "ajaypalsinghlo/world-happiness-report-2021",
        "netflix": "shivamb/netflix-shows",
    }

    WORLDBANK_INDICATORS: dict = {
        "NY.GDP.MKTP.CD": "GDP (current US$)",
        "SP.POP.TOTL": "Total Population",
        "SE.ADT.LITR.ZS": "Adult Literacy Rate",
        "EN.ATM.CO2E.PC": "CO2 emissions per capita",
    }

    UCI_DATASETS: dict = {
        "iris": 53,
        "breast_cancer": 17,
        "heart_disease": 45,
    }

    WORLDBANK_API_BASE: str = "https://api.worldbank.org/v2"
