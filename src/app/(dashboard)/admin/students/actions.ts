"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole as UserRoleEnum, type UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const studentCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  studentNumber: z.string().min(1),
  program: z.string().min(1).optional().nullable(),
  admissionDate: z.string().optional().nullable(),
});

const studentUpdateSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  studentNumber: z.string().min(1),
  program: z.string().min(1).optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
});

const studentDeleteSchema = z.object({
  studentId: z.string().min(1),
});

export async function createStudent(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = studentCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    studentNumber: formData.get("studentNumber"),
    program: formData.get("program"),
    admissionDate: formData.get("admissionDate"),
  });
  if (!parsed.success) redirect("/admin/students");

  const { name, email, password, studentNumber, program, admissionDate } = parsed.data;
  const passwordHash = await hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        role: UserRoleEnum.STUDENT,
      },
      select: { id: true },
    });

    await tx.student.create({
      data: {
        userId: user.id,
        studentNumber,
        program: program?.trim() || null,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
      },
    });
  });

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function updateStudent(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = studentUpdateSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    studentNumber: formData.get("studentNumber"),
    program: formData.get("program"),
    admissionDate: formData.get("admissionDate"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/students");

  const { studentId, name, studentNumber, program, admissionDate, password } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!existing) return;

    await tx.student.update({
      where: { id: studentId },
      data: {
        studentNumber,
        program: program?.trim() || null,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: {
        name,
        ...(password ? { passwordHash: await hash(password, 10) } : {}),
      },
    });
  });

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = studentDeleteSchema.safeParse({
    studentId: formData.get("studentId"),
  });
  if (!parsed.success) redirect("/admin/students");

  const { studentId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.student.findUnique({ where: { id: studentId } });
    if (!existing) return;

    await tx.student.delete({ where: { id: studentId } });
    await tx.user.delete({ where: { id: existing.userId } });
  });

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

