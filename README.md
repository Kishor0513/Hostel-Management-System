# Hostel Management System (HMS)

A modern, full-stack application built with Next.js, Prisma, and PostgreSQL for efficient hostel administration.

![Dashboard Preview](public/screenshots/admin-dashboard-current.png)

> **Note:** Animations and charts fully load with 3-10 second delays for optimal visual presentation.

## Dashboard Screenshots (Current Build)

### Admin Overview

![Admin Dashboard](public/screenshots/admin-dashboard-current.png)

### Students Management

![Students Dashboard](public/screenshots/students-dashboard-current.png)

### Rooms & Beds Management

![Rooms Dashboard](public/screenshots/rooms-dashboard-current.png)

### Payments & Billing

![Payments Dashboard](public/screenshots/payments-dashboard-current.png)

### Attendance Tracking

![Attendance Dashboard](public/screenshots/attendance-dashboard-current.png)

### Maintenance Requests

![Maintenance Dashboard](public/screenshots/maintenance-dashboard-current.png)

### Complaint Ticketing

![Complaints Dashboard](public/screenshots/complaints-dashboard-current.png)

### Announcements

![Announcements Dashboard](public/screenshots/announcements-dashboard-current.png)

### Staff Management

![Staff Dashboard](public/screenshots/staff-dashboard-current.png)

### Bed Allocations

![Allocations Dashboard](public/screenshots/allocations-dashboard-current.png)

### Account Management

![Account Management](public/screenshots/manage-accounts-dashboard-current.png)

### Admin Settings

![Admin Settings](public/screenshots/admin-settings-current.png)

## Dashboard Route Coverage

This project includes the following dashboard pages under `src/app/(dashboard)`. Existing screenshots are mapped below.

| Route                         | Screenshot                              |
| ----------------------------- | --------------------------------------- |
| `/admin`                      | `admin-dashboard-current.png`           |
| `/admin/allocations`          | `allocations-dashboard-current.png`     |
| `/admin/announcements`        | `announcements-dashboard-current.png`   |
| `/admin/attendance`           | `attendance-dashboard-current.png`      |
| `/admin/complaints`           | `complaints-dashboard-current.png`      |
| `/admin/maintenance`          | `maintenance-dashboard-current.png`     |
| `/admin/manage-accounts`      | `manage-accounts-dashboard-current.png` |
| `/admin/payments`             | `payments-dashboard-current.png`        |
| `/admin/rooms`                | `rooms-dashboard-current.png`           |
| `/admin/rooms/[roomId]`       | `rooms-dashboard-current.png`           |
| `/admin/settings`             | `admin-settings-current.png`            |
| `/admin/staff`                | `staff-dashboard-current.png`           |
| `/admin/staff/[staffId]`      | `staff-dashboard-current.png`           |
| `/admin/students`             | `students-dashboard-current.png`        |
| `/admin/students/[studentId]` | `students-dashboard-current.png`        |
| `/announcements`              | `announcements-dashboard-current.png`   |

## Screenshot Files (Current)

- [Admin Dashboard](public/screenshots/admin-dashboard-current.png)
- [Students Dashboard](public/screenshots/students-dashboard-current.png)
- [Rooms Dashboard](public/screenshots/rooms-dashboard-current.png)
- [Payments Dashboard](public/screenshots/payments-dashboard-current.png)
- [Attendance Dashboard](public/screenshots/attendance-dashboard-current.png)
- [Maintenance Dashboard](public/screenshots/maintenance-dashboard-current.png)
- [Complaints Dashboard](public/screenshots/complaints-dashboard-current.png)
- [Announcements Dashboard](public/screenshots/announcements-dashboard-current.png)
- [Staff Dashboard](public/screenshots/staff-dashboard-current.png)
- [Allocations Dashboard](public/screenshots/allocations-dashboard-current.png)
- [Account Management](public/screenshots/manage-accounts-dashboard-current.png)
- [Admin Settings](public/screenshots/admin-settings-current.png)

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
