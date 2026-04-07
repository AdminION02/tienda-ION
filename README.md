# 🛍️ MiTienda Online - Guía completa

Tienda online con carrito de compras, login, base de datos y pedidos por WhatsApp.

**Stack:** React + Node.js + Express + MongoDB

---

## 📁 Estructura del proyecto

```
tienda/
├── backend/          ← Servidor Node.js + Express
│   ├── models/       ← User, Product, Order (MongoDB)
│   ├── routes/       ← auth, products, orders
│   ├── middleware/   ← JWT auth
│   ├── server.js
│   └── .env.example
└── frontend/         ← React App
    └── src/
        ├── pages/    ← Home, Products, Cart, Login, Register, Orders
        ├── components/
        └── context/  ← AuthContext, CartContext
```

---

## ⚙️ Configuración local (paso a paso)

### 1. Clona o descarga el proyecto

### 2. Configura el Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus datos:
```
PORT=5000
MONGO_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/tienda
JWT_SECRET=una_clave_muy_secreta_1234567890
FRONTEND_URL=http://localhost:3000
WHATSAPP_NUMBER=573001234567   ← Tu número con código de país, sin +
```

Inicia el servidor:
```bash
npm run dev
```

### 3. Configura el Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edita `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WHATSAPP_NUMBER=573001234567
```

Inicia el frontend:
```bash
npm start
```

### 4. Carga productos de demo

Ve a `http://localhost:3000`, haz clic en **"Cargar productos demo"** en la pantalla de inicio.

---

## 🗄️ Base de datos - MongoDB Atlas (GRATIS)

1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea cuenta gratis → Create Cluster (M0 FREE)
3. En **Database Access** → Add New User con contraseña
4. En **Network Access** → Add IP Address → `0.0.0.0/0` (todos)
5. En **Connect** → Connect your application → copia la URI
6. Reemplaza `<password>` con tu contraseña en la URI
7. Pega la URI en `MONGO_URI` de tu `.env`

---

## 🚀 Deploy GRATUITO

### Backend → Render.com

1. Sube el proyecto a GitHub
2. Ve a [render.com](https://render.com) → New → Web Service
3. Conecta tu repositorio, selecciona la carpeta `backend`
4. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. En **Environment Variables** agrega:
   - `MONGO_URI` → tu URI de MongoDB Atlas
   - `JWT_SECRET` → una clave secreta larga
   - `FRONTEND_URL` → URL de tu frontend en Vercel (ver abajo)
   - `WHATSAPP_NUMBER` → tu número (ej: 573001234567)
6. Deploy → copia la URL (ej: `https://tienda-backend.onrender.com`)

### Frontend → Vercel.com

1. Ve a [vercel.com](https://vercel.com) → New Project
2. Importa tu repositorio, selecciona la carpeta `frontend`
3. En **Environment Variables** agrega:
   - `REACT_APP_API_URL` → `https://tienda-backend.onrender.com/api`
   - `REACT_APP_WHATSAPP_NUMBER` → tu número
4. Deploy → ¡listo!

---

## 📱 ¿Cómo funciona el checkout por WhatsApp?

1. Cliente agrega productos al carrito
2. Hace clic en **"Pedir por WhatsApp"**
3. El sistema guarda el pedido en MongoDB
4. Se abre WhatsApp automáticamente con un mensaje así:

```
🛍️ NUEVO PEDIDO #A1B2C3

👤 Cliente: Juan Pérez
📧 Email: juan@email.com

📦 Productos:
• 2x Camiseta Premium - $45.000
• 1x Audífonos Bluetooth - $180.000

💰 TOTAL: $270.000 COP

¡Hola! Acabo de realizar este pedido y quisiera confirmar mi compra. ✅
```

---

## 🔑 API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Usuario actual (requiere token) |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Listar productos (filtros: category, search, featured) |
| GET | `/api/products/:id` | Detalle de producto |
| POST | `/api/products` | Crear producto (solo admin) |
| PUT | `/api/products/:id` | Editar producto (solo admin) |
| DELETE | `/api/products/:id` | Eliminar producto (solo admin) |
| POST | `/api/products/seed/demo` | Cargar 8 productos de ejemplo |

### Órdenes
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/orders` | Crear orden + genera link WhatsApp |
| GET | `/api/orders/my` | Mis pedidos (requiere login) |
| GET | `/api/orders` | Todos los pedidos (solo admin) |

---

## 👑 Crear usuario Administrador

Después de registrarte normalmente, ve a MongoDB Atlas → Browse Collections → users → edita tu usuario y cambia `"role": "user"` por `"role": "admin"`.

Con rol admin puedes crear, editar y eliminar productos desde la API.

---

## 🛠️ Personalización rápida

| Qué cambiar | Dónde |
|-------------|-------|
| Tu número de WhatsApp | `backend/.env` → `WHATSAPP_NUMBER` |
| Nombre de la tienda | `frontend/src/pages/Home.js` y `Navbar.js` |
| Colores | `frontend/src/App.css` → variables `:root` |
| Categorías | `frontend/src/pages/Products.js` → array `CATEGORIES` |
| Moneda | Busca `es-CO` y `COP` en los archivos `.js` |
| Logo/ícono | Reemplaza el emoji en `Navbar.js` |

---

## 📞 Soporte

¿Problemas con el deploy? Escríbenos por WhatsApp 😄
