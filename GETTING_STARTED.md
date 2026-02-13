# 🚀 Quick Start Guide - Resolvr

Complete setup guide to run your Resolvr application from scratch.

## 📋 Prerequisites

Before starting, install these tools:

### 1. Node.js & npm
- Download from: https://nodejs.org/
- Recommended: Node.js v16 or higher
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. MongoDB
Choose ONE option:

**Option A: Local MongoDB (Recommended for learning)**
- Windows: https://www.mongodb.com/try/download/community
- After installation, MongoDB runs as a Windows service
- Verify: `mongod --version`

**Option B: MongoDB Atlas (Cloud)**
- Sign up at: https://www.mongodb.com/cloud/atlas
- Create free cluster
- Get connection string

### 3. React Native Development Environment

**For Android:**
1. Install **Android Studio**: https://developer.android.com/studio
2. During installation, select:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
3. Set up environment variables:
   ```
   ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
   ```
4. Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   ```

**For iOS (Mac only):**
- Install Xcode from App Store
- Install Xcode Command Line Tools

### 4. React Native CLI
```bash
npm install -g react-native-cli
```

---

## 🎯 Step-by-Step Setup

### PART 1: Backend Setup (5-10 minutes)

1. **Open terminal in backend folder**
   ```bash
   cd c:\Users\ompra\OneDrive\Desktop\App_dev\resolvr-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # Copy example file
   copy .env.example .env
   
   # Edit .env (use Notepad)
   notepad .env
   ```

4. **Configure .env file**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/resolvr
   JWT_SECRET=your_super_secret_change_in_production_12345
   ESCALATION_TIMEOUT_MINUTES=5
   MAX_ESCALATION_ATTEMPTS=3
   ```

5. **Start MongoDB** (if using local)
   - MongoDB should be running as a service
   - Or manually start: `mongod`

6. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   ✅ Connected to MongoDB database
   🚀 Resolvr Backend server running on port 5000
   ```

7. **Test the backend** (open new terminal)
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Should return: `{"status":"ok",...}`

---

### PART 2: Mobile App Setup (10-15 minutes)

1. **Open new terminal in mobile folder**
   ```bash
   cd c:\Users\ompra\OneDrive\Desktop\App_dev\resolvr-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This may take 5-10 minutes.

3. **Create .env file**
   ```bash
   copy .env.example .env
   notepad .env
   ```

4. **Configure .env**
   ```env
   # For Android Emulator
   API_URL=http://10.0.2.2:5000/api
   SOCKET_URL=http://10.0.2.2:5000
   
   # For Physical Device (replace XXX with your computer IP)
   # API_URL=http://192.168.1.XXX:5000/api
   # SOCKET_URL=http://192.168.1.XXX:5000
   ```

5. **Find your computer's IP** (for physical device testing)
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your network adapter.

6. **Start Metro bundler**
   ```bash
   npm start
   ```
   
   Keep this terminal open!

7. **Run on Android** (open NEW terminal)
   
   a. Start Android Emulator:
      - Open Android Studio
      - Click "AVD Manager"
      - Start an emulator (Pixel 5 recommended)
   
   b. Run the app:
      ```bash
      cd c:\Users\ompra\OneDrive\Desktop\App_dev\resolvr-mobile
      npm run android
      ```
   
   First build takes 5-10 minutes.

8. **Run on iOS** (Mac only)
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

---

## ✅ Verification Checklist

After setup, verify everything works:

### Backend Checklist
- [ ] MongoDB is running
- [ ] Backend server started on port 5000
- [ ] Health check returns "ok"
- [ ] No errors in backend terminal

### Mobile App Checklist
- [ ] Metro bundler is running
- [ ] App installed on emulator/device
- [ ] App opens without crashes
- [ ] Login screen appears

---

## 🧪 Testing the Complete System

### 1. Create Test Account

**Method A: Use Mobile App**
- Open app
- Click "Create Account"
- Fill in details:
  - Name: John Developer
  - Email: john@test.com
  - Password: password123
  - Role: Developer
- Click "Create Account"

**Method B: Use API (Postman/curl)**
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Developer\",\"email\":\"john@test.com\",\"password\":\"password123\",\"role\":\"developer\"}"
```

### 2. Login to App
- Email: john@test.com
- Password: password123
- Click "Login"

### 3. Test Dashboard
- You should see:
  - Welcome message with your name
  - Statistics cards (0 issues, 0 incidents, 0 projects)
  - Quick actions grid
  - ON CALL toggle (click to test)

### 4. Test Incident Flow (Advanced)

a. **Enable ON CALL status**
   - Tap the "OFF" badge in top right
   - Should change to green "ON CALL"

b. **Create a project** (via backend API for now)
```bash
# Get your auth token from app logs or login response
curl -X POST http://localhost:5000/api/projects ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Project\",\"key\":\"TEST\",\"description\":\"My first project\"}"
```

c. **Create an issue**
```bash
curl -X POST http://localhost:5000/api/issues ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Server is down\",\"projectId\":\"PROJECT_ID_FROM_PREVIOUS_RESPONSE\",\"type\":\"bug\",\"priority\":\"high\"}"
```

d. **Escalate to incident**
```bash
curl -X POST http://localhost:5000/api/incidents ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"issueId\":\"ISSUE_ID_FROM_PREVIOUS_RESPONSE\",\"alertMessage\":\"CRITICAL: Production server is down!\"}"
```

e. **Check mobile app**
   - You should receive push notification
   - Go to Incidents tab
   - See the critical incident
   - Click "ACKNOWLEDGE INCIDENT"
   - See response time recorded

---

## 🔧 Troubleshooting

### Backend Issues

**MongoDB connection failed**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
```bash
net start MongoDB
# Or manually: mongod
```

**Port 5000 already in use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process using port 5000
```bash
# Find process
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Mobile App Issues

**Metro bundler not starting**
```bash
npm start -- --reset-cache
```

**Android build failed**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Unable to connect to backend**
- Check API_URL in .env
- For emulator: Use `10.0.2.2`
- For physical device: Use your computer's IP
- Ensure backend is running
- Check firewall settings

**App crashes on startup**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Reinstall app
npm run android
```

---

## 📱 Testing Without Firebase (Push Notifications)

Push notifications require Firebase setup. If you want to test without it:

1. App will still work!
2. In-app notifications will work via WebSocket
3. You'll see warnings in logs: "Firebase not configured"
4. To add Firebase later, follow [Mobile README - Firebase Setup](resolvr-mobile/README.md)

---

## 🎉 Success!

If you can:
✅ Start backend server
✅ Start mobile app
✅ Login to app
✅ See dashboard

**Congratulations! Your Resolvr app is working!**

---

## 📚 Next Steps

1. **Explore the app**
   - Try all screens
   - Test ON CALL toggle
   - View Incidents tab

2. **Read documentation**
   - [Backend README](resolvr-backend/README.md) - API documentation
   - [Mobile README](resolvr-mobile/README.md) - App features

3. **Extend features**
   - Implement placeholder screens
   - Add file upload functionality
   - Build Kanban board
   - Add analytics dashboard

4. **Deploy**
   - Deploy backend to Heroku/Railway
   - Build Android APK
   - Submit to Play Store

---

## 🆘 Need Help?

Common questions:

**Q: Can I use this for my college project?**
A: Yes! This is a complete, production-ready architecture.

**Q: How do I explain this to my teacher?**
A: "We built a mobile app that combines Jira (issue tracking) and xMatters (incident management) with real-time alerts."

**Q: What makes this project unique?**
A: The incident escalation system with mobile push notifications and automatic escalation.

**Q: Do I need Firebase?**
A: Not immediately. App works without it, but Firebase adds push notifications.

**Q: Can I modify this project?**
A: Absolutely! All code is yours to customize.

---

**Happy coding! 🚀**
