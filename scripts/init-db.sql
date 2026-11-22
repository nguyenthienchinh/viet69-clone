-- Script khởi tạo database (PostgreSQL) cho dự án mẫu Viet69 Clone.
-- Chỉ chứa cấu trúc bảng; dữ liệu mẫu nằm trong src/data/*.json.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  video_url TEXT,
  duration TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  author_id INTEGER REFERENCES authors(id),
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_tags (
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_author ON videos(author_id);
CREATE INDEX IF NOT EXISTS idx_videos_upload_date ON videos(upload_date DESC);