# MERN Task Manager

A full-stack task management application built with MongoDB, Express, React, and Node.js.

## Features

- **Admin Dashboard** — stats, charts (pie + bar), recent tasks
- **Task Management** — create, edit, delete tasks with priority, status, due date, checklist
- **Team Assignment** — assign tasks to multiple users
- **User Dashboard** — personal task overview with charts
- **Task Checklist** — interactive todo items that auto-update progress and status
- **Attachments** — link external files/docs to tasks
- **Report Export** — download tasks and users reports as Excel (.xlsx)
- **Role-based Access** — admin vs member routes
- **JWT Authentication** — secure login with token stored in localStorage
- **Profile Images** — upload and display user avatars
- **Responsive UI** — works on mobile, tablet, and desktop

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS 3      |
| Charts    | Recharts                            |
| Backend   | Node.js, Express                    |
| Database  | MongoDB (Mongoose)                  |
| Auth      | JWT (jsonwebtoken) + bcryptjs       |
| Reports   | SheetJS (xlsx)                      |
| Images    | Multer                              |

---

## Project Structure

```
mern-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js               ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   ← Login, register, profile
│   │   ├── taskController.js   ← All task operations
│   │   ├── userController.js   ← User management
│   │   └── reportController.js ← Excel exports
│   ├── middleware/
│   │   ├── authMiddleware.js   ← JWT protect + adminOnly
│   │   └── uploadMiddleware.js ← Multer image upload
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── userRoutes.js
│   │   └── reportRoutes.js
│   ├── uploads/profiles/       ← Uploaded profile images
│   ├── server.js
│   ├── .env                    ← ⚠️ YOUR CREDENTIALS GO HERE
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layouts/
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── DashboardLayout.jsx
    │   │   └── cards/
    │   │       └── index.jsx   ← Reusable UI components
    │   ├── context/
    │   │   └── userContext.jsx ← Global auth state
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── SignUp.jsx
    │   │   ├── admin/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── ManageTasks.jsx
    │   │   │   ├── CreateTask.jsx  ← Also handles Edit
    │   │   │   └── ManageUsers.jsx
    │   │   └── user/
    │   │       ├── Dashboard.jsx
    │   │       ├── MyTasks.jsx
    │   │       └── ViewTaskDetails.jsx
    │   ├── utils/
    │   │   ├── axiosInstance.js ← Axios + API paths
    │   │   └── helper.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## ⚠️ WHERE TO INSERT YOUR CREDENTIALS

### Step 1 — MongoDB Connection String

Open `backend/.env` and replace the placeholder:

```env
PORT=8000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING   ← REPLACE THIS
JWT_SECRET=YOUR_JWT_SECRET_KEY             ← REPLACE THIS
ADMIN_INVITE_TOKEN=YOUR_ADMIN_TOKEN        ← REPLACE THIS (optional)
CLIENT_URL=http://localhost:5173
```

**How to get your MongoDB URI:**
1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **Cluster** (free tier is fine)
3. Click **Connect** → **Drivers** → copy the connection string
4. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority`
5. Replace `<password>` with your actual database user password
6. Paste the full string as the value of `MONGO_URI`

**JWT Secret:**
- Can be any long random string, e.g.: `my-super-secret-jwt-key-12345-abcdef`
- Used to sign authentication tokens — keep it private

**Admin Invite Token:**
- A secret code you choose, e.g.: `ADMIN2024`
- When someone registers with this token in the "Admin Invite Token" field, they get admin role
- Without it, all new users get the "member" role

---

## Installation & Running

### Prerequisites

Make sure you have installed:
- **Node.js 18+** — https://nodejs.org
- **npm** (comes with Node.js)
- A MongoDB database (free at https://cloud.mongodb.com)

---

### Step 1 — Clone / Extract the project

```bash
# If downloaded as zip, extract it first, then:
cd mern-task-manager
```

---

### Step 2 — Set up the Backend

```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure your credentials — open `backend/.env` and fill in:
```env
PORT=8000
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/taskmanager
JWT_SECRET=any-random-secret-string-here
ADMIN_INVITE_TOKEN=MYTOKEN123
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
Server running on port 8000
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

### Step 3 — Set up the Frontend

Open a **new terminal window**, then:

```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the frontend:
```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the App

Visit: **http://localhost:5173**

---

## First Time Setup

### Creating an Admin Account

1. Go to http://localhost:5173/signup
2. Fill in your name, email, and password
3. In the **Admin Invite Token** field, enter the token you set in `.env` (e.g. `MYTOKEN123`)
4. Click **Create Account**
5. You'll be logged in as admin and redirected to the admin dashboard

### Creating Member Accounts

1. Sign up **without** entering an admin invite token
2. The account will have the "member" role
3. Members can only see tasks assigned to them

### Creating Your First Task

1. Log in as admin
2. Go to **Manage Tasks** → click **New Task**
3. Fill in title, description, priority, due date
4. Select users to assign the task to (you need member accounts first)
5. Add checklist items and attachment links (optional)
6. Click **Create Task**

---

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login
GET    /api/auth/profile         Get current user profile
PUT    /api/auth/profile         Update profile
POST   /api/auth/upload-image    Upload profile photo
```

### Tasks
```
GET    /api/tasks                Get all tasks (filtered by role)
GET    /api/tasks/:id            Get task details
POST   /api/tasks                Create task (admin only)
PUT    /api/tasks/:id            Update task (admin only)
DELETE /api/tasks/:id            Delete task (admin only)
PUT    /api/tasks/:id/status     Update task status/checklist
GET    /api/tasks/dashboard-stats        Admin dashboard stats
GET    /api/tasks/user-dashboard-stats   User dashboard stats
```

### Users (Admin only)
```
GET    /api/users                Get all members
GET    /api/users/:id            Get user by ID
DELETE /api/users/:id            Delete user
```

### Reports (Admin only)
```
GET    /api/reports/export/tasks    Download tasks Excel report
GET    /api/reports/export/users    Download users Excel report
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Double-check your `MONGO_URI` in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas:
  - Atlas → Security → Network Access → Add `0.0.0.0/0` for development

### "CORS error" in browser
- Make sure `CLIENT_URL` in `backend/.env` matches your frontend URL exactly
- Default is `http://localhost:5173`

### Frontend can't reach backend
- Make sure the backend is running on port 8000
- Check `src/utils/axiosInstance.js` — `BASE_URL` should be `http://localhost:8000`

### Images not showing
- The `backend/uploads/profiles/` folder must exist (it's included in the project)
- Images are served at `http://localhost:8000/uploads/profiles/filename.jpg`

### No members showing in "Assign To" when creating a task
- You need to create member accounts first (sign up without an admin token)
- Only users with `role: "member"` appear in the list

---

## Running Both Servers Together (Optional)

Install `concurrently` in the root:
```bash
npm init -y
npm install concurrently
```

Create a root `package.json` script:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\""
  }
}
```

Then just run:
```bash
npm run dev
```

---

## Building for Production

```bash
# Build the frontend
cd frontend
npm run build
# Output goes to frontend/dist/

# Serve with backend (optional — add static serving to server.js)
# Or deploy frontend to Vercel/Netlify and backend to Railway/Render
```
