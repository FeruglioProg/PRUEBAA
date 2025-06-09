# 🚀 Configuración de Supabase para Property Finder

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Haz clic en "New Project"
5. Elige tu organización
6. Configura el proyecto:
   - **Name**: property-finder-argentina
   - **Database Password**: Crea una contraseña segura
   - **Region**: South America (São Paulo) - más cercano a Argentina
7. Haz clic en "Create new project"

## Paso 2: Configurar la Base de Datos

1. En el dashboard de Supabase, ve a "SQL Editor"
2. Copia y pega el contenido del archivo `supabase/migrations/001_initial_schema.sql`
3. Haz clic en "Run" para ejecutar el script
4. Verifica que las tablas se crearon correctamente en la pestaña "Table Editor"

## Paso 3: Obtener las Credenciales

1. Ve a "Settings" > "API"
2. Copia los siguientes valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: La clave pública
   - **service_role key**: La clave de servicio (¡mantén esta secreta!)

## Paso 4: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
\`\`\`

## Paso 5: Configurar Row Level Security (RLS)

Las políticas de seguridad ya están configuradas en el script SQL, pero puedes verificarlas:

1. Ve a "Authentication" > "Policies"
2. Verifica que las políticas estén activas para las tablas:
   - `properties`: Lectura pública permitida
   - `scraping_jobs`: Lectura pública permitida
   - `scheduled_searches`: Sin acceso público (solo backend)

## Paso 6: Probar la Conexión

1. Ejecuta `npm run dev`
2. Ve a http://localhost:3000
3. Usa el panel de debug para probar la conexión
4. Deberías ver datos de ejemplo en los resultados

## Ventajas de Usar Supabase

✅ **Sin configuración de servidor**: Todo está en la nube
✅ **Base de datos PostgreSQL**: Potente y escalable
✅ **API automática**: REST y GraphQL generadas automáticamente
✅ **Tiempo real**: Actualizaciones en vivo
✅ **Autenticación**: Sistema completo incluido
✅ **Almacenamiento**: Para archivos si es necesario
✅ **Gratis hasta 500MB**: Perfecto para empezar

## Monitoreo

En el dashboard de Supabase puedes ver:
- Uso de la base de datos
- Número de requests
- Logs en tiempo real
- Métricas de rendimiento

## Escalabilidad

Supabase escala automáticamente y puedes:
- Actualizar el plan según el uso
- Añadir más recursos
- Configurar backups automáticos
- Usar CDN global
