"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";
import type { MaintenanceStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const maintenanceCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(4000),
  studentId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  assignedToStaffId: z.string().optional().nullable(),
});

const maintenanceUpdateSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]),
  assignedToStaffId: z.string().optional().nullable(),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export async function createMaintenanceRequest(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = maintenanceCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    studentId: formData.get("studentId"),
    roomId: formData.get("roomId"),
    assignedToStaffId: formData.get("assignedToStaffId"),
  });
  if (!parsed.success) redirect("/admin/maintenance?error=invalid");

  const { title, description, studentId, roomId, assignedToStaffId } = parsed.data;

  const request = await prisma.$transaction(async (tx) => {
    const staff = assignedToStaffId
      ? await tx.staff.findUnique({
          where: { id: assignedToStaffId },
          select: { id: true, userId: true, user: { select: { isActive: true } } },
        })
      : null;
    const activeStaff = staff?.user.isActive ? staff : null;

    const created = await tx.maintenanceRequest.create({
      data: {
        title,
        description,
        studentId: studentId || null,
        roomId: roomId || null,
        createdByUserId: actor.id,
        assignedToStaffId: activeStaff?.id ?? null,
        assignedToUserId: activeStaff?.userId ?? null,
        status: "OPEN",
      },
      select: { id: true },
    });

    await tx.maintenanceLog.create({
      data: {
        requestId: created.id,
        status: "OPEN" as MaintenanceStatus,
        comment: "Created",
        changedByUserId: actor.id,
      },
    });

    return created;
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "maintenance.create",
    entityType: "MaintenanceRequest",
    entityId: request.id,
    metadata: { studentId: studentId || null, roomId: roomId || null },
  });

  revalidatePath("/admin/maintenance");
  redirect("/admin/maintenance");
}

export async function updateMaintenanceStatus(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = maintenanceUpdateSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
    assignedToStaffId: formData.get("assignedToStaffId"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) redirect("/admin/maintenance?error=invalid");

  const { requestId, status, assignedToStaffId, comment } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!existing) return false;

    const staff = assignedToStaffId
      ? await tx.staff.findUnique({
          where: { id: assignedToStaffId },
          select: { id: true, userId: true, user: { select: { isActive: true } } },
        })
      : null;
    const activeStaff = staff?.user.isActive ? staff : null;

    await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        assignedToStaffId: activeStaff?.id ?? null,
        assignedToUserId: activeStaff?.userId ?? null,
      },
    });

    await tx.maintenanceLog.create({
      data: {
        requestId,
        status,
        comment: comment || null,
        changedByUserId: actor.id,
      },
    });

    return true;
  });

  if (updated) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "maintenance.update",
      entityType: "MaintenanceRequest",
      entityId: requestId,
      metadata: {
        status,
        assignedToStaffId: assignedToStaffId || null,
        commentChanged: Boolean(comment),
      },
    });
  }

  revalidatePath("/admin/maintenance");
  redirect("/admin/maintenance");
}
