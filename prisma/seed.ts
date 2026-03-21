import 'dotenv/config';
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { AttendanceStatus, ComplaintStatus, MaintenanceStatus, UserRole } from "../src/generated/prisma/enums.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/hms",
  }),
});

async function main() {
  const adminPasswordHash = await hash("admin123", 10);
  const staffPasswordHash = await hash("staff123", 10);
  const studentPasswordHash = await hash("student123", 10);

  console.log("Cleaning up database...");
  await prisma.$transaction(async (tx) => {
    await tx.maintenanceLog.deleteMany();
    await tx.complaintLog.deleteMany();
    await tx.maintenanceRequest.deleteMany();
    await tx.complaintTicket.deleteMany();
    await tx.payment.deleteMany();
    await tx.invoice.deleteMany();
    await tx.attendanceRecord.deleteMany();
    await tx.allocation.deleteMany();
    await tx.bed.deleteMany();
    await tx.room.deleteMany();
    await tx.student.deleteMany();
    await tx.staff.deleteMany();
    await tx.user.deleteMany();
  });

  console.log("Creating admin and staff...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@hostel.local",
      name: "System Admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const warden = await prisma.staff.create({
    data: {
      staffCode: "STF-001",
      designation: "Chief Warden",
      department: "Hostel Management",
      user: {
        create: {
          email: "warden@hostel.local",
          name: "Mr. Ramesh Sharma",
          passwordHash: staffPasswordHash,
          role: UserRole.STAFF,
        },
      },
    },
    include: { user: true },
  });

  const maintenanceStaff = await prisma.staff.create({
    data: {
      staffCode: "STF-002",
      designation: "Technician",
      department: "Maintenance",
      user: {
        create: {
          email: "tech@hostel.local",
          name: "John Miller",
          passwordHash: staffPasswordHash,
          role: UserRole.STAFF,
        },
      },
    },
    include: { user: true },
  });

  console.log("Creating rooms and beds...");
  const blocks = ["Alpha", "Beta", "Gamma"];
  const allBeds = [];
  for (const block of blocks) {
    for (let floor = 1; floor <= 2; floor++) {
      for (let rNum = 1; rNum <= 2; rNum++) {
        const roomNumber = `${floor}0${rNum}`;
        const capacity = floor === 1 ? 4 : 2;
        const room = await prisma.room.create({
          data: { building: block, floor, roomNumber, capacityBeds: capacity },
        });
        for (let b = 1; b <= capacity; b++) {
          const bed = await prisma.bed.create({
            data: { roomId: room.id, bedNumber: b },
          });
          allBeds.push(bed);
        }
      }
    }
  }

  console.log("Creating 12 students with realistic data...");
  const studentsRaw = [
    { name: "Suman Kumar", email: "suman@student.local", sn: "S24001", prog: "B.Tech CS" },
    { name: "Priya Raj", email: "priya@student.local", sn: "S24002", prog: "B.Tech IT" },
    { name: "Amit Singh", email: "amit@student.local", sn: "S24003", prog: "BCA" },
    { name: "Sneha Kapur", email: "sneha@student.local", sn: "S24004", prog: "B.Arch" },
    { name: "Rohit Verma", email: "rohit@student.local", sn: "S24005", prog: "BBA" },
    { name: "Ananya Das", email: "ananya@student.local", sn: "S24006", prog: "B.Tech EC" },
    { name: "Vikram Rathore", email: "vikram@student.local", sn: "S24007", prog: "B.Tech CS" },
    { name: "Ishaan Mehta", email: "ishaan@student.local", sn: "S24008", prog: "MCA" },
    { name: "Kavya Iyer", email: "kavya@student.local", sn: "S24009", prog: "MBA" },
    { name: "Rahul Dravid", email: "rahul@student.local", sn: "S24010", prog: "B.Tech ME" },
    { name: "Sara Ali", email: "sara@student.local", sn: "S24011", prog: "B.Tech CS" },
    { name: "Arjun Reddy", email: "arjun@student.local", sn: "S24012", prog: "B.Sc Physics" },
  ];

  const students = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < studentsRaw.length; i++) {
    const s = studentsRaw[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: studentPasswordHash,
        role: UserRole.STUDENT,
      },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentNumber: s.sn,
        program: s.prog,
        admissionDate: new Date(ninetyDaysAgo.getTime() + i * 2 * 24 * 60 * 60 * 1000),
      },
    });
    students.push(student);

    // Allocate beds to 10 students (out of 12) to show room for more
    if (i < 10) {
      await prisma.allocation.create({
        data: {
          bedId: allBeds[i].id,
          studentId: student.id,
          startDate: student.admissionDate || now,
          transferReason: "Initial allotment",
        },
      });
    }
  }

  console.log("Generating financial history...");
  for (const st of students) {
    for (let m = 0; m < 3; m++) {
      const pStart = new Date(now);
      pStart.setMonth(pStart.getMonth() - m - 1);
      pStart.setDate(1);
      const pEnd = new Date(pStart);
      pEnd.setMonth(pEnd.getMonth() + 1);
      pEnd.setDate(0);

      const amount = 4500 + (st.studentNumber.charCodeAt(5) % 10) * 150;
      const status = m === 0 ? "PENDING" : "PAID";

      const invoice = await prisma.invoice.create({
        data: {
          studentId: st.id,
          periodStart: pStart,
          periodEnd: pEnd,
          dueDate: new Date(pEnd.getTime() + 5 * 24 * 60 * 60 * 1000),
          amountDue: amount,
          status,
        },
      });

      if (status === "PAID") {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amountPaid: amount,
            paymentDate: new Date(invoice.dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            method: "Online Banking",
            reference: `TXN-${Math.random().toString(36).toUpperCase().slice(2, 10)}`,
          },
        });
      } else if (Math.random() > 0.4) {
        // Some students have partial payments
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amountPaid: amount * 0.4,
            paymentDate: now,
            method: "UPI",
            reference: `TXN-P-${Math.random().toString(36).toUpperCase().slice(2, 6)}`,
          },
        });
      }
    }
  }

  console.log("Generating attendance data...");
  for (let d = 0; d < 30; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayStr = date.toISOString().slice(0, 10);

    for (const st of students) {
      // 85% - 98% attendance
      const isPresent = Math.random() > 0.1;
      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: st.id, date: new Date(dayStr) } },
        create: { studentId: st.id, date: new Date(dayStr), status: isPresent ? "PRESENT" : "ABSENT" },
        update: { status: isPresent ? "PRESENT" : "ABSENT" },
      });
    }
  }

  console.log("Generating tickets and logs...");
  const mRequest = await prisma.maintenanceRequest.create({
    data: {
      title: "Clogged Drain in Alpha-101",
      description: "Severe water clogging in the common bathroom of Alpha-101.",
      status: "OPEN",
      priority: 3,
      roomId: (await prisma.room.findFirst({ where: { building: "Alpha", roomNumber: "101" } }))?.id,
      createdByUserId: admin.id,
    },
  });
  await prisma.maintenanceLog.create({
    data: { requestId: mRequest.id, status: "OPEN", comment: "Ticket opened via admin panel", changedByUserId: admin.id },
  });

  const complaint = await prisma.complaintTicket.create({
    data: {
      subject: "Poor Internet Connection",
      description: "WiFi is almost unusable in Beta block 2nd floor during peaks.",
      status: "IN_PROGRESS",
      priority: 2,
      studentId: students[0].id,
      createdByUserId: students[0].userId,
      assignedToUserId: warden.userId,
      assignedToStaffId: warden.id,
    },
  });
  await prisma.complaintLog.create({
    data: { ticketId: complaint.id, status: "IN_PROGRESS", comment: "Warden is looking into ISP settings", changedByUserId: warden.userId },
  });

  console.log("DUMMY DATA GENERATION SUCCESSFUL!");
  console.log("Updated 12 students, financial records, and attendance.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
