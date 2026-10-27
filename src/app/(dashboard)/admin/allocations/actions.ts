"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const allocationCreateSchema = z.object({
  bedId: z.string().min(1),
  studentId: z.string().min(1),
  startDate: z.string().optional().nullable(),
  transferReason: z.string().trim().max(500).optional().nullable(),
});

const allocationUpdateSchema = z.object({
  allocationId: z.string().min(1),
  transferReason: z.string().trim().max(500).optional().nullable(),
});

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export async function assignBed(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = allocationCreateSchema.safeParse({
    bedId: formData.get("bedId"),
    studentId: formData.get("studentId"),
    startDate: formData.get("startDate"),
    transferReason: formData.get("transferReason"),
  });
  if (!parsed.success) redirect("/admin/allocations?error=invalid");

  const { bedId, studentId, startDate, transferReason } = parsed.data;
  const start = startDate ? new Date(startDate) : new Date();

  if (
    Number.isNaN(start.getTime()) ||
    start.getTime() > Date.now() + 24 * 60 * 60 * 1000
  ) {
    redirect("/admin/allocations?error=invalid");
  }

  let result;

  try {
    result = await prisma.$transaction(
      async (tx) => {
        const [bed, student] = await Promise.all([
          tx.bed.findUnique({
            where: { id: bedId },
            select: { id: true, bedNumber: true, roomId: true },
          }),
          tx.student.findUnique({
            where: { id: studentId },
            select: {
              id: true,
              studentNumber: true,
              user: { select: { isActive: true } },
            },
          }),
        ]);

        if (!bed || !student || !student.user.isActive) {
          return { ok: false as const, reason: "invalid" };
        }

        const closedAllocationIds: string[] = [];

        const existingBedAllocation = await tx.allocation.findFirst({
          where: { bedId, endDate: null },
          orderBy: { startDate: "desc" },
          select: { id: true, studentId: true, startDate: true },
        });

        const existingStudentAllocation = await tx.allocation.findFirst({
          where: { studentId, endDate: null },
          orderBy: { startDate: "desc" },
          select: { id: true, bedId: true, startDate: true },
        });

        if (
          existingBedAllocation &&
          existingStudentAllocation &&
          existingBedAllocation.id === existingStudentAllocation.id
        ) {
          return { ok: false as const, reason: "already" };
        }

        const startDay = startOfUtcDay(start);

        if (
          (existingBedAllocation &&
            startDay < startOfUtcDay(existingBedAllocation.startDate)) ||
          (existingStudentAllocation &&
            startDay < startOfUtcDay(existingStudentAllocation.startDate))
        ) {
          return { ok: false as const, reason: "invalid" };
        }

        if (existingBedAllocation) {
          await tx.allocation.update({
            where: { id: existingBedAllocation.id },
            data: {
              endDate: start,
              transferReason: transferReason || "Bed reassigned",
            },
          });
          closedAllocationIds.push(existingBedAllocation.id);
        }

        if (existingStudentAllocation) {
          await tx.allocation.update({
            where: { id: existingStudentAllocation.id },
            data: {
              endDate: start,
              transferReason: transferReason || "Transferred to another bed",
            },
          });
          closedAllocationIds.push(existingStudentAllocation.id);
        }

        const allocation = await tx.allocation.create({
          data: {
            bedId,
            studentId,
            startDate: start,
            transferReason: transferReason || null,
          },
          select: { id: true },
        });

        return {
          ok: true as const,
          allocationId: allocation.id,
          closedAllocationIds,
          studentNumber: student.studentNumber,
          bedNumber: bed.bedNumber,
          roomId: bed.roomId,
        };
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2034") {
      redirect("/admin/allocations?error=conflict");
    }
    throw error;
  }

  if (!result.ok) {
    redirect(
      result.reason === "already"
        ? "/admin/allocations?error=already"
        : "/admin/allocations?error=invalid",
    );
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "allocation.assign",
    entityType: "Allocation",
    entityId: result.allocationId,
    metadata: {
      bedId,
      studentId,
      studentNumber: result.studentNumber,
      bedNumber: result.bedNumber,
      roomId: result.roomId,
      closedAllocationIds: result.closedAllocationIds,
    },
  });

  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}

export async function updateTransferReason(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = allocationUpdateSchema.safeParse({
    allocationId: formData.get("allocationId"),
    transferReason: formData.get("transferReason"),
  });
  if (!parsed.success) redirect("/admin/allocations?error=invalid");

  const { allocationId, transferReason } = parsed.data;

  const updated = await prisma.allocation.updateMany({
    where: { id: allocationId },
    data: { transferReason: transferReason || null },
  });

  if (updated.count > 0) {
    await writeAuditLog({
      actorUserId: actor.id,
      action: "allocation.update",
      entityType: "Allocation",
      entityId: allocationId,
      metadata: { transferReason: transferReason || null },
    });
  }

  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}

export async function deleteAllocation(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const allocationId = z
    .string()
    .min(1)
    .safeParse(formData.get("allocationId"));

  if (!allocationId.success) {
    redirect("/admin/allocations?error=invalid");
  }

  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId.data },
    include: {
      student: { select: { studentNumber: true } },
      bed: { select: { bedNumber: true, roomId: true } },
    },
  });

  if (!allocation) {
    redirect("/admin/allocations");
  }

  if (!allocation.endDate) {
    redirect("/admin/allocations?error=active");
  }

  await prisma.allocation.delete({ where: { id: allocation.id } });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "allocation.delete",
    entityType: "Allocation",
    entityId: allocation.id,
    metadata: {
      studentNumber: allocation.student.studentNumber,
      bedNumber: allocation.bed.bedNumber,
      roomId: allocation.bed.roomId,
      startDate: allocation.startDate.toISOString(),
      endDate: allocation.endDate?.toISOString(),
      transferReason: allocation.transferReason,
    },
  });

  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}
