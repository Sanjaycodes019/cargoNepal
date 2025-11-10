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

## Usage

1. Start MongoDB locally or use MongoDB Atlas
2. Start the backend server
3. Seed the admin user (first time only)
4. Start the frontend server
5. Open `http://localhost:3000` in your browser
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

