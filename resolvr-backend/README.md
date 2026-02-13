# 🔧 Resolvr Backend

Node.js + Express backend server for Resolvr mobile application.

## 🏗️ Architecture

```
Backend Structure:
├── src/
│   ├── server.js              # Main entry point
│   ├── models/                # MongoDB schemas
│   │   ├── User.js           # User model with authentication
│   │   ├── Project.js        # Project model
│   │   ├── Issue.js          # Issue/task model
│   │   ├── Incident.js       # Critical incident model
│   │   └── Notification.js   # Notification model
│   ├── routes/               # API endpoints
│   │   ├── auth.js           # Authentication routes
│   │   ├── projects.js       # Project management
│   │   ├── issues.js         # Issue tracking
│   │   ├── incidents.js      # Incident escalation (xMatters-like)
│   │   ├── users.js          # User management
│   │   └── notifications.js  # Notification handling
│   ├── middleware/           # Express middleware
│   │   └── auth.js           # JWT authentication
│   └── services/             # Business logic
│       └── notificationService.js  # Push/SMS notifications
├── package.json
└── .env                      # Environment variables
```

## 📦 Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (Developer, Admin, Manager)
- Secure password hashing with bcrypt
- Profile management

### ✅ Project Management
- Create and manage projects
- Add team members
- Set on-call rotation
- Project-based access control

### ✅ Issue Tracking (Jira-like)
- Create tasks, bugs, and features
- Assign to team members
- Set priority and severity
- Kanban board organization
- Comments and activity tracking
- Real-time updates via WebSocket

### ✅ Incident Management (xMatters-like)
- Escalate issues to critical incidents
- Automatic alert distribution to on-call users
- Push notifications via Firebase
- SMS alerts (optional with Twilio)
- One-tap acknowledgment
- Auto-escalation if no response
- Response time tracking

### ✅ Real-time Features
- WebSocket connections via Socket.io
- Live notifications
- Real-time issue updates
- Instant incident alerts

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local or cloud)
3. **Firebase Project** (for push notifications)
4. **Twilio Account** (optional, for SMS)

### Installation

1. **Install dependencies**
```bash
cd resolvr-backend
npm install
```

2. **Set up environment variables**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configurations
```

Required environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resolvr
JWT_SECRET=your_super_secret_key_change_in_production
ESCALATION_TIMEOUT_MINUTES=5
MAX_ESCALATION_ATTEMPTS=3
```

3. **Set up MongoDB**

**Option A: Local MongoDB**
```bash
# Windows: Start MongoDB service
net start MongoDB

# macOS/Linux:
mongod --dbpath=/path/to/data
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Update `MONGODB_URI` in .env

4. **Set up Firebase (for push notifications)**

Firebase is required for mobile push notifications:

a. Create Firebase project:
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Name it "Resolvr" and follow wizard

b. Download service account:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in backend root

c. Enable Cloud Messaging:
   - Go to Project Settings → Cloud Messaging
   - Note the Server Key (needed for mobile app)

5. **Set up Twilio (optional for SMS)**

Only needed if you want SMS alerts:

a. Create Twilio account: https://www.twilio.com/try-twilio
b. Get a phone number
c. Add to .env:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:5000`

### Testing the API

**Check health:**
```bash
curl http://localhost:5000/api/health
```

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Developer",
    "email": "john@example.com",
    "password": "password123",
    "role": "developer"
  }'
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/on-call` - Toggle on-call status
- `POST /api/auth/logout` - Logout

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/members` - Add member
- `PUT /api/projects/:id/on-call` - Set on-call users

### Issues
- `POST /api/issues` - Create issue
- `GET /api/issues` - List issues (with filters)
- `GET /api/issues/:id` - Get issue details
- `PUT /api/issues/:id` - Update issue
- `POST /api/issues/:id/comments` - Add comment
- `GET /api/issues/kanban/:projectId` - Get Kanban board

### Incidents (Critical)
- `POST /api/incidents` - Create critical incident
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/acknowledge` - Acknowledge incident
- `PUT /api/incidents/:id/resolve` - Resolve incident

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔒 Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

## 🔔 How Incident Escalation Works

This is the xMatters-like feature:

1. **Trigger**: Developer marks issue as critical incident
2. **Alert**: System sends push notifications to on-call users
3. **Escalation**: If no acknowledgment in 5 minutes, escalate to next level
4. **Acknowledgment**: On-call developer taps "Acknowledge" in app
5. **Resolution**: Developer resolves incident, stops alerts
6. **Metrics**: System tracks response time and acknowledgment rate

```
Timeline Example:
─────────────────────────────────────────────────
00:00  🚨 Incident created → Push to Developer A
00:05  ⏰ No response → Escalate to Developer B
00:10  ⏰ No response → Escalate to Manager C
00:11  ✅ Manager C acknowledges (Response time: 11 min)
00:45  ✅ Incident resolved
```

## 🧪 Testing Incident Flow

1. Start the server: `npm run dev`
2. Register two users (developer and on-call)
3. Create a project and add both users
4. Set one user as on-call
5. Create an issue
6. Escalate to incident via API:
```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "<issue_id>",
    "alertMessage": "Server down!",
    "impactDescription": "Payment processing stopped"
  }'
```

## 🐛 Troubleshooting

**MongoDB connection failed:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in .env
- For Atlas: Whitelist your IP address

**Push notifications not working:**
- Check Firebase service account file exists
- Verify FCM token is saved during login
- Test with FCM testing tools

**Port already in use:**
```bash
# Change PORT in .env or kill existing process
netstat -ano | findstr :5000  # Windows
lsof -ti:5000 | xargs kill    # macOS/Linux
```

## 📊 Database Schema

### User
- Authentication (email, password)
- Role (developer, admin, manager)
- On-call status
- FCM token for push notifications
- Response time metrics

### Project
- Basic info (name, key, description)
- Members and owner
- On-call rotation
- Status (active, archived)

### Issue
- Title, description, type
- Priority and severity
- Status tracking
- Comments and activity
- Assignee and reporter

### Incident
- Linked to issue
- Escalation chain
- Acknowledgment tracking
- Response time calculation
- Alert history

### Notification
- User-specific notifications
- Read/unread status
- Priority and type
- Deep links to app screens

## 🔐 Security Best Practices

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Rate limit** API endpoints
4. **Validate inputs** (express-validator used)
5. **Secure MongoDB** with authentication
6. **Keep dependencies updated**: `npm audit fix`

## 📈 Performance Tips

- Enable MongoDB indexes (already configured)
- Use connection pooling
- Cache frequently accessed data
- Implement pagination for large lists
- Use WebSocket for real-time features

## 🚀 Deployment

**Deploy to Heroku:**
```bash
heroku create resolvr-backend
heroku addons:create mongolab
git push heroku main
```

**Deploy to Railway:**
```bash
railway init
railway add MongoDB
railway up
```

**Environment Variables in Production:**
- Set all .env variables in hosting platform
- Upload Firebase service account securely
- Use production MongoDB URI

## 📝 Next Steps

1. ✅ Backend complete and running
2. ➡️ Build mobile app (React Native)
3. ➡️ Connect mobile app to this API
4. ➡️ Test end-to-end incident flow
5. ➡️ Deploy to production

## 🆘 Support

Issues or questions? Create an issue in the repository or contact the development team.

---

**Backend is ready! 🎉 Now let's build the mobile app.**
