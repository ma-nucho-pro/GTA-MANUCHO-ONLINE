# Seguridad de Supabase en GitHub

## Archivos

- `juego/supabase-config.local.js`: contiene la URL y la clave anon/publishable para uso local. Está ignorado por Git.
- `juego/supabase-config.example.js`: plantilla pública sin credenciales.
- `.github/workflows/deploy-pages.yml`: genera el archivo de configuración durante la publicación usando GitHub Actions Secrets.

## Secrets que debes crear en GitHub

En el repositorio abre **Settings > Secrets and variables > Actions > New repository secret** y crea:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`

Después abre **Settings > Pages** y en **Build and deployment > Source** selecciona **GitHub Actions**.

## Importante

La clave anon/publishable puede usarse en un cliente web cuando Row Level Security está correctamente configurado. Nunca coloques una clave `service_role` o `sb_secret_...` en este proyecto web.
