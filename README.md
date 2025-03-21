# Leave Management System - Backend

## 📌 Overview
The **Leave Management System Backend** is a robust and scalable backend service designed to handle leave requests efficiently. It allows employees to apply for leaves, managers to approve or reject requests, and administrators to manage the system seamlessly.

Built using **Node.js**, **Express.js**, and **Prisma ORM**, it ensures smooth database interactions with **PostgreSQL** while maintaining security with **JWT authentication**.

---

## 🚀 Tech Stack
- **Node.js** - Backend runtime
- **Express.js** - Web framework for APIs
- **Prisma ORM** - Database ORM for PostgreSQL
- **PostgreSQL** - Relational Database
- **JWT (JSON Web Token)** - Authentication
- **Cron Jobs** - Automated email notifications
- **Nodemailer** - Email service integration
- **Cookie Parser** - Manage authentication cookies
- **CORS** - Enable cross-origin resource sharing

---

## 🛠️ Installation & Setup

### 1️⃣ Clone the Repository
```sh
  git clone https://github.com/alok-mishra143/leave-management-backend.git
  cd leave-management-backend
```

### 2️⃣ Install Dependencies
```sh
  npm install
```

### 3️⃣ Set Up Environment Variables
Create a **.env** file in the root directory and configure the following:
```env
DATABASE_URL="your_database_url"
PORT=5000
JWT_SECRET="your_secret_key"
NEXTJS_URL="your_frontend_url"
ADMIN_EMAIL="admin_email"
ADMIN_PASSWORD="admin_password"
G_PASS="google_app_password_for_nodemailer"
G_EMAIL="your_app_email"
```

### 4️⃣ Run Database Migrations
```sh
  npx prisma migrate dev --name init
```

### 5️⃣ Start the Server
```sh
  npm start
```
The server will run at **http://localhost:5000**.

---

## 📡 API Endpoints

### 🔹 Authentication Routes
| Method | Endpoint         | Description        |
|--------|----------------|--------------------|
| GET    | `/api/auth` | Check if auth route is working |
| POST   | `/api/auth/login` | Login a user |
| POST   | `/api/auth/logout` | Logout a user |
| POST   | `/api/auth/verify` | Verify authentication token |
| POST   | `/api/auth/me` | Get user role |

### 🔹 Student Routes
| Method | Endpoint         | Description |
|--------|----------------|-------------|
| POST   | `/api/student/register` | Register a student |
| POST   | `/api/student/apply-leave/:id` | Apply for leave |
| PATCH  | `/api/student/edit-leave/:id` | Edit leave request |
| PATCH  | `/api/student/update-profile` | Update student profile |
| DELETE | `/api/student/delete-leave/:id` | Delete leave request |
| GET    | `/api/student/staff/:department` | Get teachers for leave |
| GET    | `/api/student/personal-leaves/:id` | Get personal leave history |
| GET    | `/api/student/leaves-balance/:id` | Get leave balance |
| GET    | `/api/student/dashboard` | Get all approved leaves |

### 🔹 Admin Routes
| Method | Endpoint         | Description |
|--------|----------------|-------------|
| POST   | `/api/admin/signup` | Sign up a new admin |
| PATCH  | `/api/admin/leave/:id` | Update leave status |
| PATCH  | `/api/admin/user/:id` | Update user information |
| DELETE | `/api/admin/user/:id` | Delete a user |
| POST   | `/api/admin/users` | Get all users |
| GET    | `/api/admin/leaves` | View leave requests |
| GET    | `/api/admin/student` | Get student list |
| GET    | `/api/admin/dashboard` | Get dashboard info |

---

## 🔔 Cron Job - Pending Leave Requests
A **cron job** runs every hour to check for pending leave requests and sends a notification email to managers using **Nodemailer**.

---

## 🌍 Project Structure
```
📂 src
 ┣ 📂 controllers
 ┃ ┣ 📜 authController.ts
 ┃ ┣ 📜 studentController.ts
 ┃ ┣ 📜 adminController.ts
 ┣ 📂 middleware
 ┃ ┣ 📜 auth.ts
 ┣ 📂 constants
 ┃ ┣ 📜 Message.ts
 ┣ 📂 routes
 ┃ ┣ 📜 authRoute.ts
 ┃ ┣ 📜 studentRoute.ts
 ┃ ┣ 📜 adminRoute.ts
 ┣ 📂 cron
 ┃ ┣ 📜 cronJob.ts
 ┣ 📜 index.ts (Root entry file)
 ┣ 📜 prisma/schema.prisma
```

---

## 🎯 Features
✅ Employee leave request system  
✅ Manager approval workflow  
✅ Role-based authentication (Admin/User)  
✅ Automated email notifications  
✅ Secure API with JWT Authentication  
✅ Prisma ORM for smooth database interactions  
✅ Cron job for pending request notifications  

---



## 🌐 Frontend Repository
🔗 [Leave Management Frontend](https://github.com/yourusername/leave-management-frontend)

---



