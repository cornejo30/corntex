# Corntex 🔗

Un acortador de URLs simple, pero muy funcional. Tiene un diseño oscuro pero amigable al usuario, usa glassmorphism y está hecho para ser rápido y seguro.

## 🛠 Lo que usa:
- **Backend:** Node.js + Express.
- **Base de Datos:** SQLite (con `better-sqlite3`).
- **Frontend:** HTML + JS puro + Tailwind CSS (estilo premium).
- **Seguridad:** JWT para sesiones, Bcrypt para contraseñas y Rate Limiting para que no lo tumben.

## 📁 Estructura:
- `src/`: Aquí vive toda la lógica del servidor (auth, DB, ruteo).
- `public/`: El frontend. HTML y JS que corre en el navegador.
- `shorten.db`: Base de datos local (se ignora en git por seguridad, *debes crearla tu mismo* :P).

## 🚀 Cómo correrlo:

### Opción A: Con Docker (Recomendado para evitar errores de dependencias)
1. Asegúrate de tener **Docker** y **Docker Compose** instalados.
2. Crea tu archivo de configuración:
   ```bash
   cp .env.example .env
   ```
3. Inicia el contenedor:
   ```bash
   docker compose up -d --build
   ```
4. Entra a: `http://localhost:3000`

### Opción B: Sin Docker (Manual)
1. Instala lo necesario:
   ```bash
   npm install
   ```
2. Lánzalo:
   ```bash
   npm start
   ```
3. Entra a: `http://localhost:3000`

## 🐳 Persistencia con Docker:
La base de datos se guarda en `shorten.db` en tu carpeta local. Docker la monta automáticamente para que no pierdas tus enlaces al apagar el contenedor.

## 🔧 Solución de líos rápidos:
### El puerto 3000 está ocupado:
Si te sale el error `EADDRINUSE`, es que algo ya está usando el puerto 3000. 
- **Opción A (Matar el proceso en Windows):**
  ```powershell
  netstat -ano | findstr :3000
  taskkill /F /PID <El-Número-Que-Salga-Al-Final>
  ```
- **Opción B (Usando Docker):**
  Cambia el puerto en tu archivo `.env` o directamente en el `docker-compose.yml`.

---
Hecho para ser el acortador más limpio que uses.

