# ISACA Silicon Valley - Backend API

Node.js/Express backend with PostgreSQL database for the ISACA Silicon Valley event management system.

## 🚀 Features

- ✅ JWT-based authentication with role-based access control
- ✅ User management (Admin, Member, Non-member, Student roles)
- ✅ Event management with full CRUD operations
- ✅ Event registration system with payment tracking
- ✅ Notifications system
- ✅ Certificates management
- ✅ Support ticket system
- ✅ Dashboard statistics

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Update `.env` file with your database credentials
   - Change `JWT_SECRET` to a secure random string

3. **Set up the database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE silicon_valley_db;
   
   # Exit psql
   \q
   
   # Run the schema
   psql -U postgres -d silicon_valley_db -f database/schema.sql
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔐 Default Admin Credentials

After running the schema, you can login as admin:
- **Email:** admin@isacasv.org
- **Password:** Admin@123

⚠️ **IMPORTANT:** Change this password after first login!

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Base URL
```
http://localhost:5000/api
```

### Main Endpoints

- `/api/auth` - Authentication (register, login, profile)
- `/api/users` - User management (Admin only)
- `/api/events` - Event management
- `/api/registrations` - Event registrations
- `/api/notifications` - Notifications
- `/api/certificates` - Certificates
- `/api/support` - Support tickets
- `/api/dashboard/stats` - Dashboard statistics (Admin)

## 🧪 Testing

### Using Thunder Client (VS Code)

1. Install Thunder Client extension in VS Code
2. Import the collection: `thunder-client-collection.json`
3. Set up environment variables:
   - `base_url`: http://localhost:5000
   - `token`: Your user JWT token
   - `admin_token`: Admin JWT token

### Manual Testing

1. Register a new user:
   ```bash
   POST http://localhost:5000/api/auth/register
   ```

2. Login:
   ```bash
   POST http://localhost:5000/api/auth/login
   ```

3. Use the returned token in subsequent requests:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── eventController.js   # Event management
│   ├── registrationController.js
│   ├── notificationController.js
│   └── miscController.js
├── middleware/
│   ├── auth.js              # JWT auth & authorization
│   ├── errorHandler.js      # Error handling
│   └── validator.js         # Request validation
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── events.js
│   ├── registrations.js
│   ├── notifications.js
│   └── misc.js
├── database/
│   └── schema.sql           # Database schema
├── utils/
│   └── generateHash.js      # Password hash generator
├── .env                     # Environment variables
├── server.js                # Main application
└── package.json
```

## 🔧 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=silicon_valley_db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

## 🛡️ Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Helmet.js security headers
- Input validation with express-validator
- SQL injection prevention with parameterized queries

## 📊 Database Schema

See [database/schema.sql](./database/schema.sql) for the complete database structure including:
- Users and roles
- Events with venue, speakers, sponsors, agenda
- Registrations with payment tracking
- Certificates
- Notifications
- Support tickets

## 🚦 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🐛 Troubleshooting

### Database connection fails
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `silicon_valley_db` exists

### Port already in use
- Change `PORT` in `.env` file
- Or stop the process using port 5000

## 📝 License

ISC

## 👥 Author

Sachin Yadav
