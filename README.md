# React + Vite

## Conexion con la API

En desarrollo, Vite redirige `/api` hacia `http://127.0.0.1:8000`. Usa `VITE_API_URL=/api/v1` para mantener la cookie de sesion en el mismo origen y evitar conflictos entre `localhost` y `127.0.0.1`.

Despues de cambiar `vite.config.js` o `.env`, reinicia `npm run dev`.

## Ambientes

La configuración pública está centralizada en `src/config/environment.js`. Nunca agregues contraseñas, JWT, tokens privados o claves de servidor a variables `VITE_*`: Vite las incorpora al JavaScript visible por el navegador.

Comandos de ejecución:

```powershell
npm run dev:local
npm run dev
npm run dev:pre
npm run dev:prod
```

- Desarrollo: `.env.development` y `npm run dev`.
- Preproduccion: `.env.preproduction` y `npm run build:preproduction`.
- Produccion: `.env.production` y `npm run build:production`.

Copia la plantilla correspondiente `*.example` y reemplaza el dominio de la API. Vite incorpora las variables `VITE_*` durante el build, por lo que cada ambiente debe generar su propio artefacto `dist/`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
