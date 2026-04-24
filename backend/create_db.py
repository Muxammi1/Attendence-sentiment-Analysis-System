import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

try:
    conn = psycopg2.connect(dbname="postgres", user="postgres", password="admin123", host="localhost")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    try:
        cur.execute("CREATE USER aasas_user WITH PASSWORD 'aasas_password';")
        print("Role aasas_user created.")
    except Exception as e:
        print("Role creation error (might exist):", e)
        
    try:
        cur.execute("CREATE DATABASE aasas_db OWNER aasas_user;")
        print("Database aasas_db created successfully.")
    except Exception as e:
        print("DB creation error (might exist):", e)
        
    try:
        cur.execute("GRANT ALL PRIVILEGES ON DATABASE aasas_db TO aasas_user;")
        print("Privileges granted.")
    except Exception as e:
        print("Grant privileges error:", e)
        
    cur.close()
    conn.close()
except Exception as e:
    print("Could not connect:", e)
    sys.exit(1)
