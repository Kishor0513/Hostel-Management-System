"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";
import type { AttendanceStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const attendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]),
  note: z.string().optional().nullable(),
});

export async function recordAttendance(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = attendanceSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) redirect("/admin/attendance");

  const { studentId, date, status, note } = parsed.data;

  await prisma.attendanceRecord.upsert({
    where: {
      studentId_date: {
        studentId,
        date: new Date(date),
      },
    },
    update: {
      status: status as AttendanceStatus,
      note: note?.trim() || null,
    },
    create: {
      studentId,
      date: new Date(date),
      status: status as AttendanceStatus,
      note: note?.trim() || null,
    },
  });

  revalidatePath("/admin/attendance");
  redirect("/admin/attendance");
}

