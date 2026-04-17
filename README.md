# Corntex — Acortador de enlaces

Es una plataforma de acortamiento de URLs de alto rendimiento, diseñada para ofrecer una experiencia de usuario fluida; Construida sobre una arquitectura minimalista pero robusta.


### Frontend (Modern UI/UX)
- **Tailwind CSS**: Implementación de una arquitectura utility-first que ha sustituido completamente al CSS tradicional, permitiendo un diseño ágil y extremadamente pulido.
- **Glassmorphism 2.0**: Uso avanzado de desenfoques de fondo (`backdrop-blur`), bordes micro-perceptibles y degradados suaves.
- **Google Fonts (Outfit & Inter)**: Combinación tipográfica premium que mejora la legibilidad y la jerarquía visual.
- **Micro-interacciones**: Animaciones fluidas desarrolladas con Tailwind para estados hover, carga y transiciones de página.

### Backend (Seguridad & Potencia)
- **Node.js + Express**: Servidor optimizado capaz de manejar redirecciones y peticiones de API con latencia mínima.
- **Seguridad Robusta**: 
  - **Tiered Rate Limiting**: Sistema inteligente de limitación de tasa que diferencia entre navegación fluida y protección estricta contra ataques de fuerza bruta en autenticación.
  - **Helmet.js**: Cabeceras de seguridad HTTP configuradas para mitigar ataques comunes.
  - **Validator.js**: Saneamiento estricto de inputs tanto en cliente como en servidor.
- **JWT (JSON Web Token)**: Autenticación segura y escalable.
- **Bcrypt.js**: Hash de contraseñas de última generación.

### Infraestructura de Datos
- **better-sqlite3**: Motor de base de datos SQL ultrarrápido y local. Al ser autocontenido (`corntex.db`), ofrece un rendimiento superior para aplicaciones de este volumen sin la sobrecarga de un servidor externo.

---

## 🛠️ Funcionalidades

1.  **Shortening Inteligente**: Algoritmos basados en Nano ID para generar enlaces cortos únicos y seguros.
2.  **Panel de Estadísticas (Dashboard)**: Visualización en tiempo real de clics, enlaces activos y rendimiento global del usuario.
3.  **Códigos QR Dinámicos**: Generación instantánea de QRs de diseño limpio para cada enlace acortado.
4.  **Expiración Personalizable**: Control total sobre la vida útil de tus enlaces (desde 1 hora hasta permanentes).
5.  **Validación de Contraseñas**: Sistema visual de fuerza de contraseña en tiempo real para garantizar cuentas seguras.

---

## 📁 Arquitectura del Proyecto

- **`server.js`**: Orquestador principal. Incluye middleware de seguridad, limitadores de tasa y ruteo de archivos estáticos.
- **`database.js`**: Capa de persistencia optimizada con sentencias preparadas para prevenir inyecciones SQL.
- **`/public`**:
  - `index.html` & `dashboard.html`: Interfaces reactivas construidas íntegramente con componentes Tailwind.
  - `js/`: Módulos especializados para Autenticación, Lógica Principal y Gestión del Dashboard.

---

## 📦 Instalación y Uso Local

Sigue estos pasos para poner en marcha Corntex:

1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Iniciar el servidor**:
   ```bash
   npm start
   ```
3. **Acceder**: Abre `http://localhost:3000` en tu navegador.

---

## 🔧 Solución de Problemas

### Error: `EADDRINUSE: address already in use :::3000`
Este error indica que el puerto 3000 ya está siendo utilizado. Puedes:

1. **Liberar el puerto** (En Windows):
   ```powershell
   # Encuentra el PID del proceso
   netstat -ano | findstr :3000
   # Mata el proceso (usa el PID que aparece al final)
   taskkill /F /PID <PID>
   ```
2. **Usar otro puerto**:
   ```bash
   # Windows (PowerShell)
   $env:PORT=3001; npm start
   # Linux / macOS
   PORT=3001 npm start
   ```

---

## 🔒 Compromiso de Seguridad
Corntex implementa validaciones de expresiones regulares (Regex) complejas en el servidor para evitar que URLs malformadas o scripts maliciosos entren en el sistema, asegurando que cada redirección sea segura para el usuario final.
