# Sistema de Gestión de Pedidos - Pastelitos



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



      [ Cliente / Navegador ] 
       │ (HTTP / JSON)
       ▼
[ Frontend (React + TS) ] ──(API REST)──> [ Backend (Node.js + Express) ]
                                                    │
                                            [ Sequelize ORM ]
                                                    │
                                           [ Base de Datos (PostgreSQL) ]



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



---



## Git Workflow y Estructura de Ramas



El repositorio implementa una estrategia de ramas estructurada para asegurar la calidad y estabilidad del código:

- main: Rama de producción estable.

- dev: Rama central de integración continua donde convergen las funcionalidades.

- feature/*: Ramas atómicas de desarrollo para componentes específicos de frontend y endpoints de backend.



---



## Estrategia de Despliegue (Producción)



Para llevar el proyecto a entorno productivo y disponibilizarlo online, la infraestructura se divide en servicios desacoplados en la nube:

- Frontend: Desplegado en plataformas SPA como Vercel o Netlify, conectado de forma continua al repositorio de GitHub.

- Backend: Alojado en servicios de infraestructura cloud como Render o Railway para exponer la API REST.

- Base de Datos: Base de datos relacional PostgreSQL gestionada en la nube mediante proveedores como Supabase o instancias dedicadas de los mismos servicios de hosting.



---



## Configuración e Instalación Local



1. Clonar el repositorio y situarse en la rama de integración:

   git clone <url-del-repositorio>

   cd pastelitos-app

   git checkout dev



2. Configurar e iniciar el Backend:

   cd backend

   npm install

   npm run dev



3. Configurar e iniciar el Frontend:

   cd ../frontend

   npm install

   npm run dev
