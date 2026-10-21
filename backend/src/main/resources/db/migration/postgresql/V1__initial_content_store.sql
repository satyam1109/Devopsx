CREATE TABLE content_items (
  id VARCHAR(80) PRIMARY KEY,
  payload TEXT NOT NULL
);

CREATE TABLE completions (
  lesson_id VARCHAR(80) PRIMARY KEY,
  completed_at VARCHAR(40) NOT NULL
);

CREATE TABLE preferences (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL
);

CREATE TABLE reviews (
  card_id VARCHAR(80) PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
  repetitions INTEGER NOT NULL CHECK (repetitions > 0),
  due_at VARCHAR(40) NOT NULL
);

CREATE TABLE media (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mime VARCHAR(80) NOT NULL,
  bytes BYTEA NOT NULL
);
