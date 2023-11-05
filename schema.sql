DROP TABLE IF EXISTS documents;
CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY, text TEXT NOT NULL);
INSERT INTO documents (id, text) VALUES (1, 'Cloudflare workers are cool.');