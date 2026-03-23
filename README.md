# Hostel Management System (HMS)

A modern, full-stack application built with Next.js, Prisma, and PostgreSQL for efficient hostel administration.

![Dashboard Preview](public/screenshots/admin-dashboard-dark-slate-purple-fixed-nav.png)

## Dashboard Screenshots

### Admin Overview

![Admin Dashboard](public/screenshots/admin-dashboard-dark-slate-purple-fixed-nav.png)

### Students

![Students Dashboard](public/screenshots/students-dashboard.png)

### Rooms and Beds

![Rooms Dashboard](public/screenshots/rooms-dashboard.png)

### Payments

![Payments Dashboard](public/screenshots/payments-dashboard.png)

### Attendance

![Attendance Dashboard](public/screenshots/attendance-dashboard.png)

### Maintenance

![Maintenance Dashboard](public/screenshots/maintenance-dashboard.png)

### Complaints

![Complaints Dashboard](public/screenshots/complaints-dashboard.png)

### Announcements

![Announcements Dashboard](public/screenshots/announcements-dashboard.png)

## Screenshot Links

- [Admin Dashboard Dark (Fixed Nav)](public/screenshots/admin-dashboard-dark-slate-purple-fixed-nav.png)
- [Admin Dashboard Dark](public/screenshots/admin-dashboard-dark-slate-purple.png)
- [Admin Dashboard Tahoe Light v2](public/screenshots/admin-dashboard-tahoe-light-v2.png)
- [Admin Dashboard Tahoe Light v3](public/screenshots/admin-dashboard-tahoe-light-v3.png)
- [Admin Dashboard Tahoe Light v4](public/screenshots/admin-dashboard-tahoe-light-v4.png)
- [Admin Dashboard Tahoe Light](public/screenshots/admin-dashboard-tahoe-light.png)
- [Admin Dashboard Tahoe](public/screenshots/admin-dashboard-tahoe.png)
- [Admin Dashboard](public/screenshots/admin-dashboard.png)
- [Admin Settings Tahoe Light v2](public/screenshots/admin-settings-tahoe-light-v2.png)
- [Admin Settings Tahoe Light v3](public/screenshots/admin-settings-tahoe-light-v3.png)
- [Announcements Dashboard](public/screenshots/announcements-dashboard.png)
- [Attendance Dashboard](public/screenshots/attendance-dashboard.png)
- [Complaints Dashboard](public/screenshots/complaints-dashboard.png)
- [Maintenance Dashboard](public/screenshots/maintenance-dashboard.png)
- [Payments Dashboard](public/screenshots/payments-dashboard.png)
- [Rooms Dashboard](public/screenshots/rooms-dashboard.png)
- [Students Dashboard Tahoe Light](public/screenshots/students-dashboard-tahoe-light.png)
- [Students Dashboard Tahoe](public/screenshots/students-dashboard-tahoe.png)
- [Students Dashboard](public/screenshots/students-dashboard.png)

## 🚀 Key Features

- **Premium Authentication**: Custom-built login portal with glassmorphism design and secure session management via NextAuth.
- **Enhanced Dashboard**: Visual-first administration with AreaCharts and PieCharts for real-time monitoring of occupancy, revenue, and attendance.
- **Realistic Data Seeding**: Robust seed script to generate 12+ students, 3 months of financial history, and 30 days of attendance for immediate testing.
- **Operations Management**:
  - **Rooms & Beds**: Track allocation and capacity.
  - **Billing**: Automated invoice generation and payment tracking.
  - **Attendance**: Daily presence logs.
  - **Support Tickets**: Integrated maintenance and complaint ticketing system.
- **Announcements**: Broadcast system for notices and updates.
- **Unified Hover System**: A single global cursor-follow glow effect is applied consistently across cards, tables, controls, and dashboard modules.
- **Theme Modes**: Two polished theme options are supported: `White` and `Violet Dark`.

## 🎨 Theme & Interaction

- Theme state is controlled at the root layout using `data-theme` on the `html` element.
- `ThemeToggle` switches between `light` (white) and `dark-violet` only.
- Global pointer-follow hover intensity is handled by `GlobalMouseFollow` and shared `.theme-mouse-follow` styles.
- Competing hover overlays are neutralized so the UI always uses one consistent hover language.

## 🛠️ Setup & Installation

1. **Environment Variables**: Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/hms"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Database Setup**:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed Demo Data**:

   ```bash
   npx -y tsx prisma/seed.ts
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🔐 Login Credentials (Demo)

| Role        | Email                 | Password     |
| ----------- | --------------------- | ------------ |
| **Admin**   | `admin@hostel.local`  | `admin123`   |
| **Warden**  | `warden@hostel.local` | `staff123`   |
| **Student** | `suman@student.local` | `student123` |

## 🧪 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Styling**: Tailwind CSS & Framer Motion (Glassmorphism)
- **UI Components**: Radix UI & Lucide Icons
