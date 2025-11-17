# Product Inventory Management System

A full-stack web application for managing product inventory with user authentication, categories, and product tracking.

## Features

- 🔐 User Authentication (Login/Register)
- 📦 Product Management (Create, Read, Update, Delete)
- 🏷️ Category Management
- 📊 Dashboard with Statistics
- ⚠️ Low Stock Alerts
- 🎨 Modern and Responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React.js
- React Router DOM
- Axios
- Tailwind CSS
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas account)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Product-Inventory-Management-System
```

### 2. Install all dependencies

From the project root run:
```bash
# Install root tooling (concurrently)
npm install

# Install backend + frontend deps
npm run install:all
# or individually
npm run install:backend
npm run install:frontend
```

### 3. Configure environment variables

Backend:
```bash
cp backend/env.example backend/.env
# Set JWT_SECRET and (optionally) MONGO_URI if you have a real cluster
# Leave MONGO_URI empty + USE_IN_MEMORY_DB=true to use the built-in ephemeral DB
```

Frontend:
```bash
cp frontend/env.example frontend/.env
# Set REACT_APP_API_URL if your API is not http://localhost:5000
```

## Running the Application

### Start both servers (recommended)

```bash
npm run dev
```

This uses `concurrently` to run:
- Backend API on `http://localhost:5000`
- React app on `http://localhost:3000`

You can also start them separately:

```bash
npm run dev:backend   # runs nodemon in /backend
npm run dev:frontend  # runs React dev server
```

## Project Structure

```
Product-Inventory-Management-System/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   └── productController.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   └── Product.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   └── products.js
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── ui/
    │   ├── contexts/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Products.jsx
    │   │   └── Categories.jsx
    │   ├── App.js
    │   ├── App.css
    │   └── index.css
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (requires authentication)
- `PUT /api/products/:id` - Update product (requires authentication)
- `DELETE /api/products/:id` - Delete product (requires authentication)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category (requires authentication)
- `PUT /api/categories/:id` - Update category (requires authentication)
- `DELETE /api/categories/:id` - Delete category (requires authentication)

## Default Credentials

After setting up the application, you can register a new account or use these test credentials if you've seeded the database:

- Email: test@example.com
- Password: password123

## Features in Detail

### Dashboard
- View total products count
- View total categories count
- View low stock items count
- List of products with low stock (quantity ≤ 5)

### Products Management
- Add new products with details (name, category, price, quantity, supplier, description)
- Edit existing products
- Delete products
- View all products in a table format
- Visual indicator for low stock items

### Categories Management
- Create new categories
- Edit existing categories
- Delete categories (only if no products are associated)
- View all categories

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=
JWT_SECRET=change-me
USE_IN_MEMORY_DB=true
```

> Copy `backend/env.example` to `backend/.env` to get started quickly.  
> When `MONGO_URI` is empty (or the connection fails) **and** `USE_IN_MEMORY_DB=true`, the server spins up an in-memory MongoDB instance automatically so `npm run dev` works without any external services.  
> For production make sure you provide a strong `JWT_SECRET`, set a real `MONGO_URI`, and flip `USE_IN_MEMORY_DB` to `false`.

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000
```

If you deploy the API elsewhere, update `REACT_APP_API_URL` so every axios request automatically targets the correct backend.

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or your MongoDB Atlas connection string is correct
- Check if the port 27017 is not being used by another service

### Frontend Not Loading Styles
- Make sure Tailwind CSS is properly installed: `npm install -D tailwindcss postcss autoprefixer`
- Ensure `tailwind.config.js` exists in the frontend root
- Clear cache and restart the development server

### CORS Issues
- The backend is configured to accept requests from all origins during development
- For production, update the CORS settings in `server.js`

## Future Enhancements

- [ ] Product search and filtering
- [ ] Export data to CSV/PDF
- [ ] Product images upload
- [ ] User roles and permissions
- [ ] Inventory history tracking
- [ ] Email notifications for low stock
- [ ] Barcode scanning support
- [ ] Multi-language support

## License

ISC

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.





