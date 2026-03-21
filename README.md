# Hostel Management System (HMS)

A modern, full-stack application built with Next.js, Prisma, and PostgreSQL for efficient hostel administration.

![Dashboard Preview](file:///C:/Users/Key%20Sho%20Wor/.gemini/antigravity/brain/d5b241d3-7546-45e8-b5d0-332403ec48da/admin_dashboard_ui_1774106778840.png)

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

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@hostel.local` | `admin123` |
| **Warden** | `warden@hostel.local` | `staff123` |
| **Student** | `suman@student.local` | `student123` |

## 🧪 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Styling**: Tailwind CSS & Framer Motion (Glassmorphism)
- **UI Components**: Radix UI & Lucide Icons
