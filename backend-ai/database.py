from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Folosim datele de conexiune standard pentru PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://civicos_user:civicos_password@localhost:5432/civicos_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
