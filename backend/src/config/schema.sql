-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GIFs table
CREATE TABLE IF NOT EXISTS gifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    duration DECIMAL(10, 2),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GIF-Tags junction table
CREATE TABLE IF NOT EXISTS gif_tags (
    gif_id UUID REFERENCES gifs(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gif_id, tag_id)
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection-GIFs junction table
CREATE TABLE IF NOT EXISTS collection_gifs (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    gif_id UUID REFERENCES gifs(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, gif_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gif_id UUID REFERENCES gifs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, gif_id)
);

-- Create indexes for better performance
CREATE INDEX idx_gifs_uploader ON gifs(uploader_id);
CREATE INDEX idx_gifs_uploaded_at ON gifs(uploaded_at DESC);
CREATE INDEX idx_gifs_favorite_count ON gifs(favorite_count DESC);
CREATE INDEX idx_gif_tags_gif ON gif_tags(gif_id);
CREATE INDEX idx_gif_tags_tag ON gif_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

-- Create full-text search index on tags
CREATE INDEX idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);
