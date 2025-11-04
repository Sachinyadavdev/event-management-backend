# ISACA Silicon Valley - Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## API Endpoints

### 🔐 Authentication (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "Test123",
    "phone": "1234567890",
    "company": "Tech Corp",
    "position": "Developer"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Test123"
  }
  ```

#### Get Current User
- **GET** `/api/auth/me`
- **Access:** Private

#### Update Profile
- **PUT** `/api/auth/profile`
- **Access:** Private

#### Change Password
- **PUT** `/api/auth/password`
- **Access:** Private

---

### 👥 Users Management (`/api/users`)
**All routes require Admin role**

#### Get All Users
- **GET** `/api/users`
- **Query Params:** `status`, `role`, `search`, `page`, `limit`

#### Get User by ID
- **GET** `/api/users/:id`

#### Update User
- **PUT** `/api/users/:id`

#### Delete User
- **DELETE** `/api/users/:id`

#### Update User Status
- **PUT** `/api/users/:id/status`
- **Body:** `{ "status": "active" }` (pending, active, inactive, suspended)

#### Update User Role
- **PUT** `/api/users/:id/role`
- **Body:** `{ "role_id": 2 }`

#### Get User Statistics
- **GET** `/api/users/stats`

---

### 📅 Events (`/api/events`)

#### Get All Events
- **GET** `/api/events`
- **Access:** Public
- **Query Params:** `status`, `category`, `search`, `page`, `limit`, `upcoming`

#### Get Event by ID
- **GET** `/api/events/:id`
- **Access:** Public
- **Returns:** Full event details with venue, speakers, sponsors, agenda

#### Create Event
- **POST** `/api/events`
- **Access:** Admin
- **Body:**
  ```json
  {
    "event_title": "Cybersecurity Summit 2025",
    "hosted_by": "ISACA Silicon Valley",
    "event_status": "published",
    "event_category": "Conference",
    "event_date": "2025-11-15",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "member_price": 100.00,
    "non_member_price": 150.00,
    "max_attendees": 200,
    "cpe_hours": 8.0,
    "event_tags": ["cybersecurity", "conference"],
    "event_description": "Annual summit",
    "venue": { ... },
    "speakers": [ ... ],
    "sponsors": [ ... ],
    "agenda": [ ... ]
  }
  ```

#### Update Event
- **PUT** `/api/events/:id`
- **Access:** Admin

#### Delete Event
- **DELETE** `/api/events/:id`
- **Access:** Admin

#### Get Event Statistics
- **GET** `/api/events/admin/stats`
- **Access:** Admin

---

### 🎟️ Event Registrations (`/api/registrations`)

#### Register for Event
- **POST** `/api/registrations/:eventId`
- **Access:** Private (any authenticated user)

#### Cancel Registration
- **DELETE** `/api/registrations/:eventId`
- **Access:** Private

#### Get My Registrations
- **GET** `/api/registrations/my`
- **Access:** Private

#### Get Event Attendees
- **GET** `/api/registrations/event/:eventId`
- **Access:** Admin

#### Mark as Attended
- **PUT** `/api/registrations/:id/attended`
- **Access:** Admin
- **Body:** `{ "attended": true, "cp_score": 8 }`

#### Update Payment Status
- **PUT** `/api/registrations/:id/payment`
- **Access:** Admin
- **Body:**
  ```json
  {
    "payment_status": "completed",
    "payment_method": "credit_card",
    "transaction_id": "TXN123456"
  }
  ```

---

### 🔔 Notifications (`/api/notifications`)

#### Get My Notifications
- **GET** `/api/notifications`
- **Access:** Private
- **Query Params:** `unread_only`, `page`, `limit`

#### Get Unread Count
- **GET** `/api/notifications/unread-count`
- **Access:** Private

#### Mark as Read
- **PUT** `/api/notifications/:id/read`
- **Access:** Private

#### Mark All as Read
- **PUT** `/api/notifications/read-all`
- **Access:** Private

#### Delete Notification
- **DELETE** `/api/notifications/:id`
- **Access:** Private

#### Create Notification
- **POST** `/api/notifications`
- **Access:** Admin

---

### 📝 Miscellaneous

#### Get All Roles
- **GET** `/api/roles`
- **Access:** Public

#### Get My Certificates
- **GET** `/api/certificates/my`
- **Access:** Private

#### Issue Certificate
- **POST** `/api/certificates`
- **Access:** Admin

#### Get Support Tickets
- **GET** `/api/support`
- **Access:** Private (users see their own, admins see all)

#### Create Support Ticket
- **POST** `/api/support`
- **Access:** Private
- **Body:**
  ```json
  {
    "subject": "Need help",
    "message": "Description of issue",
    "category": "Registration",
    "priority": "Medium"
  }
  ```

#### Update Support Ticket
- **PUT** `/api/support/:id`
- **Access:** Admin

#### Get Dashboard Statistics
- **GET** `/api/dashboard/stats`
- **Access:** Admin
- **Returns:** Complete statistics for users, events, registrations, support tickets

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10,
  "data": [ ... ]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Testing

1. Import `thunder-client-collection.json` into Thunder Client
2. Update environment variables (`token`, `admin_token`)
3. Start testing endpoints

## Notes

- New users start with status `pending` and need admin approval
- Admin role is required for user management and event creation
- Events must be `published` status to accept registrations
- CPE scores are automatically updated when marking attendance
