-- Crear tabla de propiedades
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    surface DECIMAL(10, 2) NOT NULL,
    price_per_m2 DECIMAL(15, 2) NOT NULL,
    source TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    published_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_m2 ON properties(price_per_m2);

-- Crear tabla de búsquedas programadas
CREATE TABLE IF NOT EXISTS scheduled_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    schedule_time TEXT NOT NULL,
    neighborhoods TEXT[] NOT NULL,
    owner_only BOOLEAN NOT NULL DEFAULT FALSE,
    time_range TEXT NOT NULL,
    custom_start_date DATE,
    custom_end_date DATE,
    max_price_per_m2 DECIMAL(15, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear tabla de trabajos de scraping
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending',
    criteria JSONB NOT NULL,
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_searches_updated_at ON scheduled_searches;
CREATE TRIGGER update_scheduled_searches_updated_at 
    BEFORE UPDATE ON scheduled_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir lectura pública para propiedades)
DROP POLICY IF EXISTS "Allow public read access on properties" ON properties;
CREATE POLICY "Allow public read access on properties" ON properties
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on scraping_jobs" ON scraping_jobs;
CREATE POLICY "Allow public read access on scraping_jobs" ON scraping_jobs
    FOR SELECT USING (true);

-- Insertar datos de ejemplo
INSERT INTO properties (id, title, link, total_price, surface, price_per_m2, source, neighborhood, is_owner, published_date) VALUES
('example-1', 'Departamento 2 ambientes en Palermo Hollywood', 'https://www.zonaprop.com.ar/ejemplo-1', 180000, 65, 2769, 'Zonaprop', 'Palermo', true, NOW()),
('example-2', 'Monoambiente luminoso en Belgrano', 'https://www.argenprop.com/ejemplo-2', 120000, 45, 2667, 'Argenprop', 'Belgrano', false, NOW()),
('example-3', 'Departamento de categoría en Recoleta', 'https://inmuebles.mercadolibre.com.ar/ejemplo-3', 250000, 85, 2941, 'MercadoLibre', 'Recoleta', true, NOW()),
('example-4', 'Loft en San Telmo histórico', 'https://www.zonaprop.com.ar/ejemplo-4', 140000, 55, 2545, 'Zonaprop', 'San Telmo', true, NOW()),
('example-5', 'Departamento en Villa Crespo con terraza', 'https://www.argenprop.com/ejemplo-5', 155000, 60, 2583, 'Argenprop', 'Villa Crespo', false, NOW())
ON CONFLICT (id) DO NOTHING;
