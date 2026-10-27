"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN"];

const staffCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  staffCode: z.string().trim().min(1).max(40),
  designation: z.string().trim().min(1).max(120).optional().nullable(),
  department: z.string().trim().min(1).max(120).optional().nullable(),
});

const staffUpdateSchema = z.object({
  staffId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  staffCode: z.string().trim().min(1).max(40),
  designation: z.string().trim().min(1).max(120).optional().nullable(),
  department: z.string().trim().min(1).max(120).optional().nullable(),
  password: z.string().min(8).max(72).optional().nullable(),
});

const staffDeleteSchema = z.object({
  staffId: z.string().min(1),
});

export async function createStaff(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = staffCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    staffCode: formData.get("staffCode"),
    designation: formData.get("designation"),
    department: formData.get("department"),
  });
  if (!parsed.success) redirect("/admin/staff?error=invalid");

  const { name, email, password, staffCode, designation, department } = parsed.data;
  const passwordHash = await hash(password, 12);

  let staffId: string;

  try {
    staffId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "STAFF",
        },
        select: { id: true },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          staffCode,
          designation: designation?.trim() || null,
          department: department?.trim() || null,
        },
        select: { id: true },
      });

      return staff.id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/staff?error=duplicate");
    }
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "staff.create",
    entityType: "Staff",
    entityId: staffId,
    metadata: { email, staffCode },
  });

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function updateStaff(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = staffUpdateSchema.safeParse({
    staffId: formData.get("staffId"),
    name: formData.get("name"),
    staffCode: formData.get("staffCode"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/staff?error=invalid");

  const { staffId, name, staffCode, designation, department, password } = parsed.data;

  try {
    const found = await prisma.$transaction(async (tx) => {
      const existing = await tx.staff.findUnique({
        where: { id: staffId },
        include: { user: true },
      });
      if (!existing) return false;

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
          ...(password ? { passwordHash: await hash(password, 12) } : {}),
        },
      });

      return true;
    });

    if (found) {
      await writeAuditLog({
        actorUserId: actor.id,
        action: "staff.update",
        entityType: "Staff",
        entityId: staffId,
        metadata: { staffCode, passwordChanged: Boolean(password) },
      });
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/staff?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = staffDeleteSchema.safeParse({
    staffId: formData.get("staffId"),
  });
  if (!parsed.success) redirect("/admin/staff?error=invalid");

  const { staffId } = parsed.data;

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!existing) {
    redirect("/admin/staff");
  }

  if (existing.userId === actor.id) {
    redirect("/admin/staff?error=self");
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaintTicket.updateMany({
      where: { assignedToStaffId: staffId, status: { not: "RESOLVED" } },
      data: { assignedToStaffId: null, assignedToUserId: null },
    });
    await tx.maintenanceRequest.updateMany({
      where: { assignedToStaffId: staffId, status: { not: "DONE" } },
      data: { assignedToStaffId: null, assignedToUserId: null },
    });
    await tx.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    });
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "staff.deactivate",
    entityType: "Staff",
    entityId: staffId,
    metadata: { email: existing.user.email },
  });

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

