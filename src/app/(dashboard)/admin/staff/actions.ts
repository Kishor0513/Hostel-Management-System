"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const staffCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  staffCode: z.string().min(1),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
});

const staffUpdateSchema = z.object({
  staffId: z.string().min(1),
  name: z.string().min(1),
  staffCode: z.string().min(1),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
});

const staffDeleteSchema = z.object({
  staffId: z.string().min(1),
});

export async function createStaff(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = staffCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    staffCode: formData.get("staffCode"),
    designation: formData.get("designation"),
    department: formData.get("department"),
  });
  if (!parsed.success) redirect("/admin/staff");

  const { name, email, password, staffCode, designation, department } = parsed.data;
  const passwordHash = await hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        role: "STAFF",
      },
      select: { id: true },
    });

    await tx.staff.create({
      data: {
        userId: user.id,
        staffCode,
        designation: designation?.trim() || null,
        department: department?.trim() || null,
      },
    });
  });

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function updateStaff(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = staffUpdateSchema.safeParse({
    staffId: formData.get("staffId"),
    name: formData.get("name"),
    staffCode: formData.get("staffCode"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/staff");

  const { staffId, name, staffCode, designation, department, password } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });
    if (!existing) return;

    await tx.staff.update({
      where: { id: staffId },
      data: {
        staffCode,
        designation: designation?.trim() || null,
        department: department?.trim() || null,
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

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = staffDeleteSchema.safeParse({
    staffId: formData.get("staffId"),
  });
  if (!parsed.success) redirect("/admin/staff");

  const { staffId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.staff.findUnique({ where: { id: staffId } });
    if (!existing) return;
    await tx.staff.delete({ where: { id: staffId } });
    await tx.user.delete({ where: { id: existing.userId } });
  });

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

