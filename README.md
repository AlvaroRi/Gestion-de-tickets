# Sistema de Gestión de Tickets (HelpDesk TI)

Un ecosistema FullStack profesional diseñado para la gestión, seguimiento y análisis de incidencias técnicas en departamentos de TI. Este sistema implementa seguridad basada en roles (RBAC) y visualización de datos en tiempo real.

## Características Principales

- **Seguridad Robusta:** Autenticación basada en **JWT (JSON Web Tokens)** con persistencia en `localStorage`.
- **Control de Acceso por Roles (RBAC):**
  - **Rol 1 (Sistemas):** Panel administrativo total, gestión de estados, bitácora de notas y cierre de tickets.
  - **Rol 2 (Gerencia/Administrador):** Dashboard estadístico interactivo con gráficas de rendimiento.
  - **Rol 3 (Usuario):** Interfaz simplificada para la creación de reportes.
- **Visualización de Datos:** Gráficas dinámicas (Dona y Barras) desarrolladas con **Chart.js**.
- **Interfaz de Usuario (UX):**
  - Soporte nativo para **Modo Oscuro**.
  - Notificaciones sonoras y visuales ante nuevos tickets.
  - Exportación de reportes detallados a **Excel**.
- **Base de Datos:** Persistencia local mediante **NeDB** (formato NoSQL).

## Stack Tecnológico

**Backend:**
- Node.js & Express.js
- JSON Web Tokens (JWT) para seguridad.
- NeDB-Promises para manejo de base de datos NoSQL.

**Frontend:**
- HTML5, CSS3 (Variables CSS para temas).
- JavaScript Vanilla (ES6+).
- Chart.js para analítica visual.
- SheetJS (XLSX) para exportación de datos.

## Estructura del Proyecto

```text
├── public/
│   ├── admin.html       # Panel para técnicos (Rol 1)
│   ├── dashboard.html   # Panel para gerencia (Rol 2)
│   ├── index.html       # Formulario para usuarios (Rol 3)
│   ├── login.html       # Acceso al sistema
│   ├── app.js           # Lógica principal del frontend
│   └── styles.css       # Estilos globales y temas
├── server.js            # Servidor API REST y lógica de seguridad
├── tickets.db           # Base de datos (Generada automáticamente)
├── package.json         # Dependencias del proyecto
└── .gitignore           # Archivos excluidos de Git

## Requisitos Previos e Instalación

1.  **Node.js**: Asegúrate de tener instalado Node.js (v14 o superior).
2.  Clona o descarga este repositorio.
3.  Abre una terminal en la carpeta del proyecto y ejecuta:

    ```bash
    npm install
    ```
    *Esto instalará las dependencias necesarias (`express`, `nedb-promises`, `cors`).*

## Ejecución del Servidor

Para iniciar la aplicación en modo desarrollo o local:

```bash
node server.js