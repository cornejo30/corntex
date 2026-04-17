# Corntex 🔗

Un acortador de URLs simple, pero con onda. Tiene un diseño oscuro tipo "Deep Slate", usa glassmorphism y está hecho para ser rápido y seguro.

## 🛠 Lo que usa:
- **Backend:** Node.js + Express.
- **Base de Datos:** SQLite (con `better-sqlite3`, vuela 🚀).
- **Frontend:** HTML + JS puro + Tailwind CSS (estilo premium).
- **Seguridad:** JWT para sesiones, Bcrypt para contraseñas y Rate Limiting para que no lo tumben.

## 📁 Estructura:
- `src/`: Aquí vive toda la lógica del servidor (auth, DB, ruteo).
- `public/`: El frontend. HTML y JS que corre en el navegador.
- `shorten.db`: Tu base de datos local (se ignora en git por seguridad).

## 🚀 Cómo correrlo:
1. Instala lo necesario:
   ```bash
   npm install
   ```
2. Lánzalo:
   ```bash
   npm start
   ```
3. Entra a: `http://localhost:3000`

## 🔧 Solución de líos rápidos:
### El puerto 3000 está ocupado:
Si te sale el error `EADDRINUSE`, es que algo ya está usando el puerto 3000. 
- **Opción A (Matar el proceso en Windows):**
  ```powershell
  netstat -ano | findstr :3000
  taskkill /F /PID <El-Número-Que-Salga-Al-Final>
  ```
- **Opción B (Cambiar el puerto):**
  ```bash
  $env:PORT=3001; npm start
  ```

---
Hecho con ganas para ser el acortador más limpio que uses.
