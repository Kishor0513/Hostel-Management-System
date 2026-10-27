"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { UserRole as UserRoleEnum, type UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const studentCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  studentNumber: z.string().trim().min(1).max(40),
  program: z.string().trim().min(1).max(120).optional().nullable(),
  admissionDate: z.string().optional().nullable(),
});

const studentUpdateSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  studentNumber: z.string().trim().min(1).max(40),
  program: z.string().trim().min(1).max(120).optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  password: z.string().min(8).max(72).optional().nullable(),
});

const studentDeleteSchema = z.object({
  studentId: z.string().min(1),
});

export async function createStudent(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = studentCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    studentNumber: formData.get("studentNumber"),
    program: formData.get("program"),
    admissionDate: formData.get("admissionDate"),
  });
  if (!parsed.success) redirect("/admin/students?error=invalid");

  const { name, email, password, studentNumber, program, admissionDate } = parsed.data;
  const admission = admissionDate ? new Date(admissionDate) : null;

  if (admission && Number.isNaN(admission.getTime())) {
    redirect("/admin/students?error=invalid");
  }

  const passwordHash = await hash(password, 12);

  let studentId: string;

  try {
    studentId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: UserRoleEnum.STUDENT,
        },
        select: { id: true },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentNumber,
          program: program?.trim() || null,
          admissionDate: admission,
        },
        select: { id: true },
      });

      return student.id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/students?error=duplicate");
    }
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "student.create",
    entityType: "Student",
    entityId: studentId,
    metadata: { email, studentNumber },
  });

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function updateStudent(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = studentUpdateSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    studentNumber: formData.get("studentNumber"),
    program: formData.get("program"),
    admissionDate: formData.get("admissionDate"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/students?error=invalid");

  const { studentId, name, studentNumber, program, admissionDate, password } = parsed.data;
  const admission = admissionDate ? new Date(admissionDate) : null;

  if (admission && Number.isNaN(admission.getTime())) {
    redirect("/admin/students?error=invalid");
  }

  try {
    const found = await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });
      if (!existing) return false;

      await tx.student.update({
        where: { id: studentId },
        data: {
          studentNumber,
          program: program?.trim() || null,
          admissionDate: admission,
        },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          name,
          ...(password ? { passwordHash: await hash(password, 12) } : {}),
        },
      });

      return true;
    });

    if (found) {
      await writeAuditLog({
        actorUserId: actor.id,
        action: "student.update",
        entityType: "Student",
        entityId: studentId,
        metadata: { studentNumber, passwordChanged: Boolean(password) },
      });
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/students?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = studentDeleteSchema.safeParse({
    studentId: formData.get("studentId"),
  });
  if (!parsed.success) redirect("/admin/students?error=invalid");

  const { studentId } = parsed.data;

  const existing = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  if (!existing) {
    redirect("/admin/students");
  }

  if (existing.userId === actor.id) {
    redirect("/admin/students?error=self");
  }

  await prisma.$transaction(async (tx) => {
    await tx.allocation.updateMany({
      where: { studentId, endDate: null },
      data: {
        endDate: new Date(),
        transferReason: "Account deactivated",
      },
    });
    await tx.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    });
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "student.deactivate",
    entityType: "Student",
    entityId: studentId,
    metadata: { email: existing.user.email },
  });

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

