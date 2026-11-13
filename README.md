# Sistema de Gestión de Pedidos - Pastelitos

## Demo online

- [Panel de usuario](https://pastelitos-app-1.onrender.com)
- [Panel de administración](https://pastelitos-app-1.onrender.com/admin) (PASS DEMO: `STANLEY`)

Sistema web full-stack desarrollado para la administración, control de producción y seguimiento de repartos de un emprendimiento local de elaboración de pastelitos artesanales. Creado bajo buenas prácticas de ingeniería de software, arquitectura modular y un flujo de control de versiones profesional.



---



## Arquitectura del Sistema



El proyecto está estructurado bajo una arquitectura desacoplada (Client-Server), dividida en dos grandes capas que se comunican mediante una API RESTful:



1. Capa de Presentación (Frontend - SPA):

   - Desarrollada en React con TypeScript.

   - Encargada de la interfaz de usuario, validaciones en tiempo real de formularios, filtrado dinámico de datos y traducción automática de unidades de cocina (bandejas y docenas).

   

2. Capa de Lógica y Persistencia (Backend - REST API):

   - Desarrollada en Node.js con Express y TypeScript.

   - Sigue un diseño modular (Modelos y Rutas) utilizando Sequelize ORM para interactuar con una base de datos relacional PostgreSQL.

   - Incluye validaciones de negocio, manejo de estados de pedidos y pruebas automatizadas con Vitest.



# Sistema de Gestión de Pedidos - Pastelitos

Sistema web full-stack desarrollado para la administración, control de producción y seguimiento de repartos de un emprendimiento local de elaboración de pastelitos artesanales. Creado bajo buenas prácticas de ingeniería de software, arquitectura modular y un flujo de control de versiones profesional.

---

## 🏗️ Arquitectura del Sistema

El proyecto está estructurado bajo una **arquitectura desacoplada (Client-Server)**, dividida en dos grandes capas que se comunican mediante una API RESTful:

1. **Capa de Presentación (Frontend - SPA)**:
   * Desarrollada en **React** con **TypeScript**.
   * Encargada de la interfaz de usuario, validaciones en tiempo real de formularios, filtrado dinámico de datos y traducción automática de unidades de cocina (bandejas y docenas).
   
2. **Capa de Lógica y Persistencia (Backend - REST API)**:
   * Desarrollada en **Node.js** con **Express** y **TypeScript**.
   * Sigue un diseño modular (Modelos y Rutas) utilizando **Sequelize ORM** para interactuar con una base de datos relacional **PostgreSQL**.
   * Incluye validaciones de negocio, manejo de estados de pedidos y pruebas automatizadas con **Vitest**.

```
[ Cliente / Navegador ] 
       │ (HTTP / JSON)
       ▼
[ Frontend (React + TS) ] ──(API REST)──> [ Backend (Node.js + Express) ]
                                                    │
                                            [ Sequelize ORM ]
                                                    │
                                           [ Base de Datos (PostgreSQL) ]
```


---



## Tecnologías y Herramientas



### Frontend

- React & TypeScript

- Vite (Build tool y empaquetador)

- CSS / Estilos adaptativos



### Backend & Base de Datos

- Node.js / Express / TypeScript

- PostgreSQL & Sequelize ORM

- Vitest (Test unitarios)



### Entorno y Control de Versiones

- Git & GitHub (Flujo de ramas feature -> dev -> main)

- Docker (Contenedorización del entorno de desarrollo)

- Visual Studio Code



---



## Funcionalidades Principales



- Panel de Administración en Vivo: Carga manual de pedidos con validación de campos obligatorios y formato estricto (nombres capitalizados, restricciones numéricas en teléfonos).

- Métricas de Cocina Automatizadas: Cálculo en tiempo real de la producción total agrupada por sabores, traduciendo bandejas individuales a formato comercial de docenas (ej: 1 bandeja (1/2 doc.), 2 bandejas (1 doc.)).

- Filtros y Ordenamiento Inteligente: Orden por defecto basado en Fecha de entrega, con alternativas por Orden de llegada y Nombre, además de filtros por gusto (Membrillo / Batata).

- Ciclo de Estados de Reparto: Transiciones dinámicas entre los estados Pendiente, En camino y Entregado.

## Búsqueda de direcciones y rutas de reparto

El formulario de pedidos usa el autocompletado de Geoapify para buscar direcciones en todo el mundo. La API key se configura únicamente en el backend mediante `GEOAPIFY_API_KEY`; nunca debe agregarse a una variable `VITE_*` ni al código del frontend. La búsqueda espera a que el usuario deje de escribir antes de consultar al proveedor.

### Cómo se valida una ubicación

- Al elegir una sugerencia, el pedido guarda dos datos relacionados pero distintos: la dirección como texto y sus coordenadas (latitud y longitud).
- El texto devuelto por el geocodificador puede incluir el número escrito aunque el punto sea aproximado o corresponda a otra entrada cercana. Por eso, elegir una sugerencia no garantiza por sí solo la ubicación exacta de la puerta.
- Antes de guardar un pedido, se puede abrir el mapa y corregir el pin con un clic en la ubicación real. En pedidos existentes, **Corregir pin** actualiza sus coordenadas sin cambiar la dirección escrita.
- El mapa de ruta, el optimizador y los enlaces de navegación usan las coordenadas guardadas. Si Google Maps muestra otra dirección, primero hay que corregir el pin; cambiar solo el texto no corrige la ubicación.
- Geoapify busca globalmente y la aplicación no fuerza automáticamente una ciudad. Para que la optimización represente un reparto local, elegí un origen y pedidos de la misma ciudad. No mezcles pedidos de ciudades distintas en una sola ruta.

### Optimización y navegación

El panel admin optimiza los pedidos de una fecha respecto de un punto de partida elegido. **Omitir de esta ruta** excluye temporalmente un pedido del cálculo sin borrarlo; **Volver a incluir** lo agrega nuevamente y recalcula el recorrido. **Iniciar viaje en Google Maps** abre el origen y las paradas en el orden calculado, usando las coordenadas de sus pines.

### Límites y trabajo pendiente

- Las paradas omitidas se mantienen solo en el estado de la página: no se eliminan del pedido ni se guardan como una planificación persistente. Al recargar el admin o cambiar la fecha, se restablece la selección.
- Google Maps puede recalcular el trazado vial y tiene límites de paradas por enlace/dispositivo. Para recorridos grandes, hay que dividir la ruta en tramos y abrir cada tramo por separado.
- La corrección del pin es manual; todavía no hay una herramienta para confirmar automáticamente que el número de puerta coincida con el punto del mapa.
- No se guarda un historial de rutas ni el progreso del viaje. Las paradas omitidas no cambian el estado del pedido ni lo marcan como entregado.
- La búsqueda no está limitada a Bahía Blanca. Si el proyecto se usa solo para reparto en una ciudad, queda pendiente configurar una restricción de ciudad o validar la localidad al guardar cada pedido.



---



## Git Workflow y Estructura de Ramas



El repositorio implementa una estrategia de ramas estructurada para asegurar la calidad y estabilidad del código:

- main: Rama de producción estable.

- dev: Rama central de integración continua donde convergen las funcionalidades.

- feature/*: Ramas atómicas de desarrollo para componentes específicos de frontend y endpoints de backend.



---



## Estrategia de Despliegue (Producción)

La aplicación tiene frontend, API y base de datos PostgreSQL como servicios separados. Para desplegarla en Render:

1. Crear una base PostgreSQL y un servicio Web para el backend con directorio raíz `backend`, comando de instalación `npm install` y comando de inicio `npm start`.
2. Configurar en el backend `NODE_ENV=production`, `DATABASE_URL` con la URL interna de PostgreSQL, `ADMIN_PASS`, `JWT_SECRET`, `GEOAPIFY_API_KEY` y `FRONTEND_URL` con el origen público exacto del frontend. Generar un secreto JWT aleatorio de al menos 32 bytes. No usar la clave demo con datos reales. `GEOAPIFY_API_KEY` es necesaria para el autocompletado y la optimización de rutas.
3. Crear el frontend como sitio estático con directorio raíz `frontend`, comando de build `npm install && npm run build` y directorio de publicación `dist`.
4. Configurar `VITE_API_URL` en el frontend con la URL pública del backend más `/api`, por ejemplo `https://tu-api.onrender.com/api`. Esta URL es pública; no poner contraseñas ni secretos en variables `VITE_*`.
5. Cada vez que cambie una variable `VITE_*`, volver a generar el build del frontend.

Render debe desplegar desde `main`. Integrar primero los cambios desde `dev` a `main` mediante un Pull Request. Antes de publicar, comprobar que el backend tenga sus variables configuradas y que la base de demo no contenga datos reales.



## Configuración e Instalación Local



1. Clonar el repositorio y situarse en la rama de integración:

   git clone <url-del-repositorio>

   cd pastelitos-app

   git checkout dev



2. Configurar las variables del backend:

   cd backend

   npm install

   Copiar `.env.example` como `.env`, completar `ADMIN_PASS`, `JWT_SECRET` y `GEOAPIFY_API_KEY`, y configurar `DATABASE_URL` o las variables `DB_*`. Generar el secreto con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. No subir `.env` a Git. La clave Geoapify solo va en el backend.

3. Iniciar el Backend:

   npm run dev

   Para cargar cuatro pedidos ficticios en una base vacía, ejecutar antes `npm run seed:demo` desde `backend`. El comando se detiene si ya hay pedidos y no modifica registros existentes. Esos datos de demostración no incluyen coordenadas verificadas y no sirven para probar la optimización de rutas hasta corregir sus ubicaciones. No incluir datos reales ni copias de bases locales en el repositorio.


4. Configurar e iniciar el Frontend:

   cd ../frontend

   npm install

   Copiar `.env.example` como `.env`. El valor predeterminado apunta al backend local.

   npm run dev

## Acceso de demostración al panel

- Ingresar desde el [panel de administración](https://pastelitos-app-1.onrender.com/admin).
- Para habilitarla en una instancia de demo, configurar `ADMIN_PASS=STANLEY` en las variables de entorno del backend. El `JWT_SECRET` debe generarse aleatoriamente y mantenerse privado; nunca se publica ni se comparte.
- Usar exclusivamente una base de datos con pedidos ficticios. El panel permite consultar y borrar pedidos, así que cualquier persona que conozca la clave puede realizar esas acciones.
- Antes de cargar datos reales o usar la app de forma privada, cambiar `ADMIN_PASS` por una clave larga y única y generar un `JWT_SECRET` nuevo. En hosting, actualizar las variables de entorno y reiniciar el backend.
- No subir `backend/.env` a GitHub. El archivo está ignorado por Git; `backend/.env.example` solo contiene nombres de variables vacíos.
