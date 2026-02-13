# 📱 Resolvr - Mobile Issue Tracker & Incident Escalation App

**Tagline:** Mini Jira + Mini xMatters - All in Your Pocket

## 🎯 What is Resolvr?

Resolvr is a mobile-first application that combines:
- **Issue Tracking** (like Jira) - Track bugs, tasks, and features
- **Incident Management** (like xMatters) - Handle critical emergencies with instant alerts

## 🚀 Why Resolvr?

- ✅ Developers always have their phones
- ✅ Critical incidents get instant mobile alerts
- ✅ One-tap acknowledgment stops escalation
- ✅ Real-time tracking on mobile Kanban boards
- ✅ Automatic escalation if no response

## ⚡ Quick Start

**Want to get started immediately?** Follow our [Getting Started Guide](GETTING_STARTED.md)

**In a hurry?**
1. Install Node.js and MongoDB
2. `cd resolvr-backend && npm install && npm run dev`
3. `cd resolvr-mobile && npm install && npm run android`

## 📁 Project Structure

```
App_dev/
├── GETTING_STARTED.md    # 👈 START HERE! Complete setup guide
├── README.md             # This file - Project overview
├── resolvr-backend/      # Node.js + Express backend
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── server.js    # Entry point
│   ├── package.json
│   └── README.md        # Backend documentation
│
└── resolvr-mobile/       # React Native mobile app
    ├── src/
    │   ├── screens/     # App screens
    │   ├── navigation/  # Navigation setup
    │   ├── context/     # State management
    │   └── services/    # API & notifications
    ├── android/         # Android native code
    ├── ios/             # iOS native code
    ├── package.json
    └── README.md        # Mobile app documentation
```

## 🛠️ Tech Stack

### Mobile App
- **React Native** - Cross-platform mobile development
- **React Navigation** - Screen navigation
- **Axios** - API communication
- **AsyncStorage** - Local data storage

### Backend
- **Node.js + Express** - REST API server
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Firebase Admin SDK** - Push notifications
- **Socket.io** - Real-time updates

### Notifications
- **Firebase Cloud Messaging (FCM)** - Push notifications
- **Twilio** (Optional) - SMS alerts

## 🏗️ Architecture

```
┌─────────────────┐
│  Mobile App     │  ← User Interface (Android/iOS)
│  (React Native) │
└────────┬────────┘
         │
         ↓ REST API + WebSocket
┌─────────────────┐
│  Backend Server │  ← Business Logic
│  (Node.js)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  MongoDB        │  ← Data Storage
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Firebase FCM   │  ← Push Notifications
└─────────────────┘
```

## ✨ Key Features

### 1️⃣ Authentication
- Secure signup/login
- Role-based access (Developer, Admin, Manager)
- JWT token-based authentication

### 2️⃣ Project Management
- Create and manage projects
- View assigned projects
- Track project progress

### 3️⃣ Issue Tracking
- Create tasks, bugs, and incidents
- Set priority (Low, Medium, High, Critical)
- Mobile-friendly Kanban board
- Assign to team members
- Track status (Open, In Progress, Resolved, Closed)

### 4️⃣ Incident Escalation (xMatters-like)
- Mark issues as CRITICAL
- Automatic push notifications to on-call developers
- SMS alerts (optional)
- Phone call escalation (advanced)
- Response time tracking

### 5️⃣ Incident Acknowledgment
- One-tap "Acknowledge" button
- Stops further escalation
- Logs who responded and when
- Records response time

### 6️⃣ Real-time Notifications
- Push notifications for new issues
- Critical alerts with sound/vibration
- In-app notification center
- SMS fallback for critical incidents

## 🎓 Learning Outcomes

This project teaches:
- ✅ Mobile app development with React Native
- ✅ RESTful API design
- ✅ Real-time communication (WebSocket)
- ✅ Database modeling (MongoDB)
- ✅ Authentication & authorization
- ✅ Push notification systems
- ✅ Incident management workflows
- ✅ Mobile UI/UX design

## 🌍 Real-World Applications

Similar systems used by:
- Software development teams (DevOps)
- IT support teams
- Cloud infrastructure monitoring
- Emergency response systems
- On-call rotation management

## 🚀 Getting Started

### For First-Time Setup:
1. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete step-by-step guide
   - Prerequisites installation
   - Backend setup
   - Mobile app setup
   - Testing the system

### For Detailed Documentation:
- **[Backend Documentation](resolvr-backend/README.md)** - API endpoints, database models, deployment
- **[Mobile App Documentation](resolvr-mobile/README.md)** - Features, screens, Firebase setup

### Quick Commands Cheat Sheet

**Backend:**
```bash
cd resolvr-backend
npm install               # Install dependencies
npm run dev              # Start development server
npm start                # Start production server
```

**Mobile App:**
```bash
cd resolvr-mobile
npm install               # Install dependencies
npm start                # Start Metro bundler
npm run android          # Run on Android
npm run ios              # Run on iOS (Mac only)
```

## 📝 Project Status

This project simulates industry-grade incident management systems used by companies like:
- PagerDuty
- Opsgenie
- xMatters
- Jira Service Management

---

Built with ❤️ for learning mobile development and incident management systems
