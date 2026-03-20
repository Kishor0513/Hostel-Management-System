"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";
import type { MaintenanceStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const maintenanceCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  studentId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  assignedToStaffId: z.string().optional().nullable(),
});

const maintenanceUpdateSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]),
  assignedToStaffId: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export async function createMaintenanceRequest(formData: FormData) {
  const user = await requireRole(allowedRoles);

  const parsed = maintenanceCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    studentId: formData.get("studentId"),
    roomId: formData.get("roomId"),
    assignedToStaffId: formData.get("assignedToStaffId"),
  });
  if (!parsed.success) redirect("/admin/maintenance");

  const { title, description, studentId, roomId, assignedToStaffId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const req = await tx.maintenanceRequest.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        studentId: studentId || null,
        roomId: roomId || null,
        createdByUserId: user.id,
        assignedToStaffId: assignedToStaffId || null,
        status: "OPEN",
      },
    });

    await tx.maintenanceLog.create({
      data: {
        requestId: req.id,
        status: "OPEN" as MaintenanceStatus,
        comment: "Created",
        changedByUserId: user.id,
      },
    });
  });

  revalidatePath("/admin/maintenance");
  redirect("/admin/maintenance");
}

export async function updateMaintenanceStatus(formData: FormData) {
  const user = await requireRole(allowedRoles);

  const parsed = maintenanceUpdateSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
    assignedToStaffId: formData.get("assignedToStaffId"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) redirect("/admin/maintenance");

  const { requestId, status, assignedToStaffId, comment } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // If we assign a staff member, we also store their userId for easier querying in the future.
    const staff = assignedToStaffId
      ? await tx.staff.findUnique({ where: { id: assignedToStaffId }, select: { userId: true } })
      : null;

    await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        assignedToStaffId: assignedToStaffId || null,
        assignedToUserId: staff?.userId ?? null,
      },
    });

    await tx.maintenanceLog.create({
      data: {
        requestId,
        status,
        comment: comment?.trim() || null,
        changedByUserId: user.id,
      },
    });
  });

  revalidatePath("/admin/maintenance");
  redirect("/admin/maintenance");
}

