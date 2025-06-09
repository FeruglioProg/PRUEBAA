-- Inicialización de la base de datos
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    surface DECIMAL(10, 2) NOT NULL,
    price_per_m2 DECIMAL(15, 2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    published_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_m2 ON properties(price_per_m2);

CREATE TABLE IF NOT EXISTS scheduled_searches (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    schedule_time VARCHAR(5) NOT NULL,
    neighborhoods TEXT[] NOT NULL,
    owner_only BOOLEAN NOT NULL DEFAULT FALSE,
    time_range VARCHAR(10) NOT NULL,
    custom_start_date DATE,
    custom_end_date DATE,
    max_price_per_m2 DECIMAL(15, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_searches_email ON scheduled_searches(email);
CREATE INDEX IF NOT EXISTS idx_scheduled_searches_is_active ON scheduled_searches(is_active);

CREATE TABLE IF NOT EXISTS scraping_jobs (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    criteria JSONB NOT NULL,
    result JSONB,
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
