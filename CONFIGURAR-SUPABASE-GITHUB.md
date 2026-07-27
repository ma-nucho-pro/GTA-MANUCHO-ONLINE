# Configuración segura de Supabase para GitHub Pages

El archivo real `juego/supabase-config.local.js` funciona en tu computadora y está ignorado por Git.

En GitHub crea dos secretos del repositorio:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Ruta: **Settings → Secrets and variables → Actions → New repository secret**.

En **Settings → Pages**, selecciona **GitHub Actions** como fuente de publicación.

> En una aplicación web, una clave `anon` o `publishable` puede verse desde el navegador una vez publicada. La seguridad real depende de RLS y de las políticas de Supabase. Nunca uses `service_role` ni `sb_secret_` en el frontend.
