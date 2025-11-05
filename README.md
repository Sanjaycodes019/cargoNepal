# CargoNepal - Cargo Booking Platform

A full-stack MERN application for booking cargo transportation services.

## Features

### Customer Features
- Browse available trucks
- View truck details
- Calculate distance and price estimates
- Request bookings with pickup and dropoff locations
- View and manage bookings

### Vehicle Owner Features
- Register and manage trucks
- View booking requests
- Accept/decline bookings
- Update booking status (in transit, completed)

### Admin Features
- View platform statistics
- Manage users (owners, customers)
- View all trucks and bookings
- Platform-level settings

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React with Vite
- React Router
- Axios for API calls
- React Context for state management
- Tailwind CSS for styling

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/cargoNepal
JWT_SECRET=verysecretkeychangethisinproduction
DEFAULT_RATE_PER_KM=25
```

**Note:** Make sure the database name in MONGO_URI is exactly `cargoNepal` (case-sensitive).

4. Make sure MongoDB is running locally (or update MONGO_URI to your MongoDB Atlas connection string)

5. Seed initial admin user:
```bash
npm run seed
```
Default admin credentials:
- Email: `admin@cargonepal.com`
- Password: `admin123`

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register as customer or owner
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Customer
- `GET /api/customer/bookings` - Get customer bookings
- `PUT /api/customer/bookings/:id/cancel` - Cancel booking

### Owner
- `GET /api/owner/trucks` - Get owner's trucks
- `POST /api/owner/trucks` - Add truck
- `PUT /api/owner/trucks/:id` - Update truck
- `DELETE /api/owner/trucks/:id` - Delete truck
- `GET /api/owner/bookings` - Get booking requests
- `PUT /api/owner/bookings/:id/status` - Update booking status

### Admin
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/user/:id` - Delete user
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/trucks` - Get all trucks
- `GET /api/admin/stats` - Get dashboard statistics
- `PUT /api/admin/settings` - Update settings

### Public
- `GET /api/trucks` - Get all trucks (with filters)
- `GET /api/trucks/:id` - Get truck details
- `POST /api/bookings` - Create booking (customer)
- `POST /api/utils/distance` - Calculate distance and price

## Project Structure

```
cargonepal/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── customerController.js
│   │   ├── ownerController.js
│   │   └── truckController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── AdminModel.js
│   │   ├── BookingModel.js
│   │   ├── CustomerModel.js
│   │   ├── OwnerModel.js
│   │   └── TruckModel.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── ownerRoutes.js
│   │   ├── truckRoutes.js
│   │   └── utilsRoutes.js
│   ├── utils/
│   │   ├── distanceCalculator.js
│   │   └── seedAdmin.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TruckDetail.jsx
│   │   │   └── Trucks.jsx
│   │   ├── utils/
│   │   │   └── axiosInstance.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── tailwind.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Usage

1. Start MongoDB locally or use MongoDB Atlas
2. Start the backend server
3. Seed the admin user (first time only)
4. Start the frontend server
5. Open `http://localhost:3001` in your browser
6. Register as a customer or owner, or login as admin

## Testing

Use the default admin credentials or create new accounts through the registration page.

For testing bookings:
1. Register as a customer
2. Register as an owner and add trucks
3. As customer, browse trucks and create bookings
4. As owner, view and manage booking requests

## Notes

- Distance calculation uses the Haversine formula
- Price is calculated as: distance × rate per km
- Booking status flow: pending → accepted/declined → in_transit → completed
- All API endpoints require authentication except public truck listings
- Role-based access control is enforced on both frontend and backend

## Future Enhancements

- Email notifications
- Map integration with Leaflet
- Advanced search and filters
- Booking history and reports
- Payment integration
- Mobile app

