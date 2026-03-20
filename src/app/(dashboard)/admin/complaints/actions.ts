"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";
import type { ComplaintStatus } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const complaintCreateSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  studentId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  assignedToStaffId: z.string().optional().nullable(),
});

const complaintUpdateSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  assignedToStaffId: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
});

export async function createComplaintTicket(formData: FormData) {
  const user = await requireRole(allowedRoles);

  const parsed = complaintCreateSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    studentId: formData.get("studentId"),
    roomId: formData.get("roomId"),
    assignedToStaffId: formData.get("assignedToStaffId"),
  });
  if (!parsed.success) redirect("/admin/complaints");

  const { subject, description, studentId, roomId, assignedToStaffId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.complaintTicket.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        studentId: studentId || null,
        roomId: roomId || null,
        createdByUserId: user.id,
        assignedToStaffId: assignedToStaffId || null,
        status: "OPEN",
      },
    });

    await tx.complaintLog.create({
      data: {
        ticketId: ticket.id,
        status: "OPEN" as ComplaintStatus,
        comment: "Created",
        changedByUserId: user.id,
      },
    });
  });

  revalidatePath("/admin/complaints");
  redirect("/admin/complaints");
}

export async function updateComplaintStatus(formData: FormData) {
  const user = await requireRole(allowedRoles);

  const parsed = complaintUpdateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    assignedToStaffId: formData.get("assignedToStaffId"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) redirect("/admin/complaints");

  const { ticketId, status, assignedToStaffId, comment } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const staff = assignedToStaffId
      ? await tx.staff.findUnique({ where: { id: assignedToStaffId }, select: { userId: true } })
      : null;

    await tx.complaintTicket.update({
      where: { id: ticketId },
      data: {
        status,
        assignedToStaffId: assignedToStaffId || null,
        assignedToUserId: staff?.userId ?? null,
      },
    });

    await tx.complaintLog.create({
      data: {
        ticketId,
        status,
        comment: comment?.trim() || null,
        changedByUserId: user.id,
      },
    });
  });

  revalidatePath("/admin/complaints");
  redirect("/admin/complaints");
}

