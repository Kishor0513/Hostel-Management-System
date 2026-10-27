"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";
import type { ComplaintStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const complaintCreateSchema = z.object({
  subject: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(4000),
  studentId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  assignedToStaffId: z.string().optional().nullable(),
});

const complaintUpdateSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  assignedToStaffId: z.string().optional().nullable(),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export async function createComplaintTicket(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = complaintCreateSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    studentId: formData.get("studentId"),
    roomId: formData.get("roomId"),
    assignedToStaffId: formData.get("assignedToStaffId"),
  });
  if (!parsed.success) redirect("/admin/complaints?error=invalid");

  const { subject, description, studentId, roomId, assignedToStaffId } = parsed.data;

  const ticket = await prisma.$transaction(async (tx) => {
    const staff = assignedToStaffId
      ? await tx.staff.findUnique({
          where: { id: assignedToStaffId },
          select: { id: true, userId: true, user: { select: { isActive: true } } },
        })
      : null;
    const activeStaff = staff?.user.isActive ? staff : null;

    const created = await tx.complaintTicket.create({
      data: {
        subject,
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

    await tx.complaintLog.create({
      data: {
        ticketId: created.id,
        status: "OPEN" as ComplaintStatus,
        comment: "Created",
        changedByUserId: actor.id,
      },
    });

    return created;
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "complaint.create",
    entityType: "ComplaintTicket",
    entityId: ticket.id,
    metadata: { studentId: studentId || null, roomId: roomId || null },
  });

  revalidatePath("/admin/complaints");
  redirect("/admin/complaints");
}

export async function updateComplaintStatus(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = complaintUpdateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    assignedToStaffId: formData.get("assignedToStaffId"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) redirect("/admin/complaints?error=invalid");

  const { ticketId, status, assignedToStaffId, comment } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.complaintTicket.findUnique({
      where: { id: ticketId },
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

    await tx.complaintTicket.update({
      where: { id: ticketId },
      data: {
        status,
        assignedToStaffId: activeStaff?.id ?? null,
        assignedToUserId: activeStaff?.userId ?? null,
      },
    });

    await tx.complaintLog.create({
      data: {
        ticketId,
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
      action: "complaint.update",
      entityType: "ComplaintTicket",
      entityId: ticketId,
      metadata: {
        status,
        assignedToStaffId: assignedToStaffId || null,
        commentChanged: Boolean(comment),
      },
    });
  }

  revalidatePath("/admin/complaints");
  redirect("/admin/complaints");
}
