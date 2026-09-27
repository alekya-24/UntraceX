import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "data", "untracex.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Create analyses table if not exists
c.execute("""
CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    ai_likelihood INTEGER NOT NULL,
    indicator_level TEXT NOT NULL,
    signals TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
)
""")

# 2. Check and add columns to documents table
c.execute("PRAGMA table_info(documents)")
doc_cols = [r[1] for r in c.fetchall()]
if "cleaned_text" not in doc_cols:
    c.execute("ALTER TABLE documents ADD COLUMN cleaned_text TEXT")
if "extracted_text" not in doc_cols:
    c.execute("ALTER TABLE documents ADD COLUMN extracted_text TEXT")

# 3. Check and add columns to metadata table
c.execute("PRAGMA table_info(metadata)")
meta_cols = [r[1] for r in c.fetchall()]
if "field_name" not in meta_cols and "metadata_key" in meta_cols:
    c.execute("ALTER TABLE metadata ADD COLUMN field_name TEXT")
    c.execute("UPDATE metadata SET field_name = metadata_key WHERE field_name IS NULL")
if "field_value" not in meta_cols and "metadata_value" in meta_cols:
    c.execute("ALTER TABLE metadata ADD COLUMN field_value TEXT")
    c.execute("UPDATE metadata SET field_value = metadata_value WHERE field_value IS NULL")

# 4. Check and add columns to cleaning_actions table
c.execute("PRAGMA table_info(cleaning_actions)")
clean_cols = [r[1] for r in c.fetchall()]
if "removed_metadata" not in clean_cols and "removed_fields" in clean_cols:
    c.execute("ALTER TABLE cleaning_actions ADD COLUMN removed_metadata TEXT")
    c.execute("UPDATE cleaning_actions SET removed_metadata = removed_fields WHERE removed_metadata IS NULL")
if "text_changes" not in clean_cols:
    c.execute("ALTER TABLE cleaning_actions ADD COLUMN text_changes TEXT")

conn.commit()
conn.close()
print("Migration completed smoothly!")
