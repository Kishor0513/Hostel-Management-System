import { hash } from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { AttendanceStatus, ComplaintStatus, MaintenanceStatus, UserRole } from "../src/generated/prisma/enums";

async function main() {
  const adminPasswordHash = await hash("admin123", 10);
  const staffPasswordHash = await hash("staff123", 10);
  const studentPasswordHash = await hash("student123", 10);

  // Clear existing data (useful for local development / demo).
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

  const admin = await prisma.user.create({
    data: {
      email: "admin@hostel.local",
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const staff = await prisma.staff.create({
    data: {
      staffCode: "STF-001",
      designation: "Warden",
      department: "Hostel Ops",
      user: {
        create: {
          email: "staff@hostel.local",
          name: "Warden",
          passwordHash: staffPasswordHash,
          role: UserRole.STAFF,
        },
      },
    },
    include: { user: true },
  });

  const extraStaff = await prisma.staff.create({
    data: {
      staffCode: "STF-002",
      designation: "Helper",
      department: "Maintenance",
      user: {
        create: {
          email: "helper@hostel.local",
          name: "Maintenance Helper",
          passwordHash: staffPasswordHash,
          role: UserRole.STAFF,
        },
      },
    },
    include: { user: true },
  });

  const roomsToCreate = [
    { building: "A", floor: 1, roomNumber: "101", capacityBeds: 4 },
    { building: "A", floor: 1, roomNumber: "102", capacityBeds: 4 },
    { building: "B", floor: 2, roomNumber: "201", capacityBeds: 6 },
  ];
  for (const r of roomsToCreate) {
    const room = await prisma.room.create({
      data: {
        building: r.building,
        floor: r.floor,
        roomNumber: r.roomNumber,
        capacityBeds: r.capacityBeds,
      },
    });
    await prisma.bed.createMany({
      data: Array.from({ length: r.capacityBeds }, (_, i) => ({
        roomId: room.id,
        bedNumber: i + 1,
      })),
    });
  }

  const allBeds = await prisma.bed.findMany({
    orderBy: [{ room: { building: "asc" } }, { room: { floor: "asc" } }, { bedNumber: "asc" }],
    include: { room: true },
  });

  const studentUsers = [
    { email: "s1@hostel.local", name: "Student One", studentNumber: "S-1001", program: "B.Tech" },
    { email: "s2@hostel.local", name: "Student Two", studentNumber: "S-1002", program: "B.Tech" },
    { email: "s3@hostel.local", name: "Student Three", studentNumber: "S-1003", program: "BCA" },
    { email: "s4@hostel.local", name: "Student Four", studentNumber: "S-1004", program: "BCA" },
    { email: "s5@hostel.local", name: "Student Five", studentNumber: "S-1005", program: "MCA" },
    { email: "s6@hostel.local", name: "Student Six", studentNumber: "S-1006", program: "B.Sc" },
  ];

  const students = [];
  for (const s of studentUsers) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: studentPasswordHash,
        role: UserRole.STUDENT,
      },
      select: { id: true },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentNumber: s.studentNumber,
        program: s.program,
        admissionDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    });

    students.push(student);
  }

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  // Create active allocations + a transfer history.
  // Beds 0..3 are occupied, bed 0 has a transfer in the past.
  await prisma.allocation.createMany({
    data: [
      {
        bedId: allBeds[0].id,
        studentId: students[0].id,
        startDate: new Date(now.getTime() - 40 * day),
        endDate: new Date(now.getTime() - 10 * day),
        transferReason: "Initial allotment",
      },
      {
        bedId: allBeds[0].id,
        studentId: students[3].id,
        startDate: new Date(now.getTime() - 10 * day),
        endDate: null,
        transferReason: "Transfer (better fit)",
      },
      {
        bedId: allBeds[1].id,
        studentId: students[1].id,
        startDate: new Date(now.getTime() - 25 * day),
        endDate: null,
        transferReason: "Allotment",
      },
      {
        bedId: allBeds[2].id,
        studentId: students[2].id,
        startDate: new Date(now.getTime() - 20 * day),
        endDate: null,
        transferReason: "Allotment",
      },
      {
        bedId: allBeds[3].id,
        studentId: students[4].id,
        startDate: new Date(now.getTime() - 15 * day),
        endDate: null,
        transferReason: "Allotment",
      },
    ],
  });

  // Note: createMany doesn't accept null for optional fields cleanly in all cases; ensure correct insert with individual calls if needed.

  // Create invoices and some payments for the last 3 months.
  const invoices = [];
  for (let m = 0; m < 3; m++) {
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - m);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    for (const st of students) {
      const invoice = await prisma.invoice.create({
        data: {
          studentId: st.id,
          periodStart,
          periodEnd,
          dueDate: new Date(periodEnd.getTime() + 10 * day),
          amountDue: 2000 + Math.floor(Math.random() * 800),
          status: "PENDING",
        },
      });
      invoices.push(invoice);
    }
  }

  // Record payments for a subset so charts look good.
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    const shouldPay = i % 2 === 0; // about half paid
    if (!shouldPay) continue;

    const paymentDate = new Date(inv.dueDate.getTime() - (Math.floor(Math.random() * 9) + 1) * day);
    const invoiceAmount = Number(inv.amountDue);
    const paymentAmount = Math.min(invoiceAmount, invoiceAmount * (0.7 + Math.random() * 0.3));

    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        amountPaid: paymentAmount,
        paymentDate,
        method: i % 3 === 0 ? "UPI" : i % 3 === 1 ? "Card" : "Cash",
        reference: `PAY-${String(i).padStart(4, "0")}`,
      },
    });
  }

  // Attendance: last 30 days for first 4 students.
  const attendanceStudents = students.slice(0, 4);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * day);
    for (const st of attendanceStudents) {
      const status = (i + st.studentNumber.length) % 5 === 0 ? "ABSENT" : "PRESENT";
      await prisma.attendanceRecord.upsert({
        where: {
          studentId_date: {
            studentId: st.id,
            date: new Date(d.toISOString().slice(0, 10)),
          },
        },
        update: { status: status as AttendanceStatus, note: null },
        create: { studentId: st.id, date: new Date(d.toISOString().slice(0, 10)), status: status as AttendanceStatus, note: null },
      });
    }
  }

  // Maintenance requests
  const maintenanceOpen = await prisma.maintenanceRequest.create({
    data: {
      title: "Fan not working",
      description: "The ceiling fan in the room is not spinning.",
      status: "OPEN",
      priority: 2,
      createdByUserId: admin.id,
      studentId: students[1].id,
      roomId: allBeds[1].roomId,
    },
  });
  await prisma.maintenanceLog.create({
    data: {
      requestId: maintenanceOpen.id,
      status: "OPEN",
      comment: "Created",
      changedByUserId: admin.id,
    },
  });

  const maintenanceInProgress = await prisma.maintenanceRequest.create({
    data: {
      title: "Leakage issue",
      description: "Water leakage under the sink.",
      status: "IN_PROGRESS",
      priority: 3,
      createdByUserId: admin.id,
      studentId: students[2].id,
      roomId: allBeds[2].roomId,
      assignedToStaffId: extraStaff.id,
      assignedToUserId: extraStaff.userId,
    },
  });
  await prisma.maintenanceLog.createMany({
    data: [
      { requestId: maintenanceInProgress.id, status: "OPEN", comment: "Received", changedByUserId: admin.id },
      { requestId: maintenanceInProgress.id, status: "IN_PROGRESS", comment: "Assigned to staff", changedByUserId: extraStaff.userId },
    ],
  });

  const maintenanceDone = await prisma.maintenanceRequest.create({
    data: {
      title: "Door alignment",
      description: "Door is not closing properly.",
      status: "DONE",
      priority: 1,
      createdByUserId: admin.id,
      studentId: students[0].id,
      roomId: allBeds[0].roomId,
      assignedToStaffId: staff.id,
      assignedToUserId: staff.userId,
    },
  });
  await prisma.maintenanceLog.createMany({
    data: [
      { requestId: maintenanceDone.id, status: "OPEN", comment: "Created", changedByUserId: admin.id },
      { requestId: maintenanceDone.id, status: "DONE", comment: "Resolved", changedByUserId: staff.userId },
    ],
  });

  // Complaint tickets
  const complaintOpen = await prisma.complaintTicket.create({
    data: {
      subject: "Internet issue",
      description: "WiFi signal is weak in the evening.",
      status: "OPEN",
      priority: 2,
      createdByUserId: admin.id,
      studentId: students[3].id,
      roomId: allBeds[0].roomId,
    },
  });
  await prisma.complaintLog.create({
    data: {
      ticketId: complaintOpen.id,
      status: "OPEN",
      comment: "Created",
      changedByUserId: admin.id,
    },
  });

  const complaintInProgress = await prisma.complaintTicket.create({
    data: {
      subject: "Power cuts",
      description: "Frequent power cuts on some days.",
      status: "IN_PROGRESS",
      priority: 3,
      createdByUserId: admin.id,
      studentId: students[4].id,
      roomId: allBeds[3].roomId,
      assignedToStaffId: staff.id,
      assignedToUserId: staff.userId,
    },
  });
  await prisma.complaintLog.createMany({
    data: [
      { ticketId: complaintInProgress.id, status: "OPEN", comment: "Received", changedByUserId: admin.id },
      { ticketId: complaintInProgress.id, status: "IN_PROGRESS", comment: "Assigned", changedByUserId: staff.userId },
    ],
  });

  const complaintResolved = await prisma.complaintTicket.create({
    data: {
      subject: "Mess quality",
      description: "Meal quality has been inconsistent.",
      status: "RESOLVED",
      priority: 2,
      createdByUserId: admin.id,
      studentId: students[5].id,
      roomId: allBeds[4].roomId,
      assignedToStaffId: extraStaff.id,
      assignedToUserId: extraStaff.userId,
    },
  });
  await prisma.complaintLog.createMany({
    data: [
      { ticketId: complaintResolved.id, status: "OPEN", comment: "Created", changedByUserId: admin.id },
      { ticketId: complaintResolved.id, status: "RESOLVED", comment: "Resolved with changes", changedByUserId: extraStaff.userId },
    ],
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Hostel check-in begins",
        content: "New admissions can check in from tomorrow 10:00 AM.",
        isPublished: true,
        publishedAt: new Date(now.getTime() - 2 * day),
        createdByUserId: admin.id,
      },
      {
        title: "Maintenance holiday notice",
        content: "Some rooms will have temporary water supply interruption on Saturday.",
        isPublished: true,
        publishedAt: new Date(now.getTime() - 8 * day),
        createdByUserId: admin.id,
      },
      {
        title: "Draft notice",
        content: "This announcement is not published yet.",
        isPublished: false,
        publishedAt: null,
        createdByUserId: admin.id,
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed. Demo credentials:");
  // eslint-disable-next-line no-console
  console.log("Admin: admin@hostel.local / admin123");
  // eslint-disable-next-line no-console
  console.log("Staff: staff@hostel.local / staff123");
  // eslint-disable-next-line no-console
  console.log("Student: s1@hostel.local / student123");
}

main()
  .then(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });

