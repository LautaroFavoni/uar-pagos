# UNAR — Sistema de Liquidación de Árbitros

Sistema web para la gestión de designaciones, liquidaciones y pagos de árbitros de la **Unión de Árbitros (UNAR)**.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Vercel (CI/CD automático desde `main`)

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/uar-pagos.git
cd uar-pagos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Iniciar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase |

## Estructura del Proyecto

```
src/
├── app/                    # Rutas (App Router)
│   ├── dashboard/          # Panel principal (protegido)
│   │   ├── carga-rapida/   # Carga de designaciones
│   │   ├── configuracion/  # ABM de árbitros, torneos, viáticos
│   │   ├── descuentos/     # Gestión de descuentos
│   │   ├── designaciones/  # Visualización de designaciones
│   │   ├── historial/      # Historial de semanas anteriores
│   │   └── resumen/        # Cierre semanal y pagos
│   ├── login/              # Autenticación
│   └── p/[id]/             # Vista pública de pagos (solo lectura)
├── components/             # Componentes reutilizables
│   ├── carga/              # Formularios de carga
│   ├── configuracion/      # Modales de configuración
│   ├── designaciones/      # Edición de designaciones
│   ├── pagos/              # Tabla de pagos (FilaArbitro)
│   ├── shared/             # Componentes compartidos
│   └── ui/                 # Primitivos shadcn/ui
├── lib/                    # Utilidades y configuración
│   ├── brand.ts            # Marca centralizada (nombre, logo, colores)
│   ├── calculos.ts         # Funciones de cálculo
│   ├── supabase/           # Cliente y servidor Supabase
│   └── types.ts            # Tipos TypeScript
└── public/                 # Assets estáticos
    └── logo.png            # Logo UNAR
```

## Personalización de Marca

Todo lo relacionado a la marca está centralizado:

- **`src/lib/brand.ts`** — Nombre, nombre largo, logo y colores
- **`src/app/globals.css`** — Variables CSS `--color-brand` y `--color-brand-hover`

Para cambiar el color de marca, modificar una sola variable en `globals.css`.

## Deploy en Vercel

El proyecto hace deploy automático al pushear a `main`:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Vercel detecta el push y despliega automáticamente.

## Migraciones de Base de Datos

Las migraciones SQL se encuentran en `supabase/migrations/`. Para aplicarlas, ejecutar el contenido directamente en el **SQL Editor** de Supabase.
