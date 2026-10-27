"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";
import type { AttendanceStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const attendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function recordAttendance(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = attendanceSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) redirect("/admin/attendance?error=invalid");

  const { studentId, date, status, note } = parsed.data;
  const recordDate = new Date(date);

  if (
    Number.isNaN(recordDate.getTime()) ||
    recordDate.getTime() > Date.now() + 24 * 60 * 60 * 1000
  ) {
    redirect("/admin/attendance?error=date");
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      studentId_date: {
        studentId,
        date: recordDate,
      },
    },
    update: {
      status: status as AttendanceStatus,
      note: note || null,
    },
    create: {
      studentId,
      date: recordDate,
      status: status as AttendanceStatus,
      note: note || null,
    },
    select: { id: true },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "attendance.record",
    entityType: "AttendanceRecord",
    entityId: record.id,
    metadata: { studentId, date, status },
  });

  revalidatePath("/admin/attendance");
  redirect("/admin/attendance");
}
