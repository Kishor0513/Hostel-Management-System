"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const allocationCreateSchema = z.object({
  bedId: z.string().min(1),
  studentId: z.string().min(1),
  startDate: z.string().optional().nullable(),
  transferReason: z.string().optional().nullable(),
});

const allocationUpdateSchema = z.object({
  allocationId: z.string().min(1),
  transferReason: z.string().optional().nullable(),
});

export async function assignBed(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = allocationCreateSchema.safeParse({
    bedId: formData.get("bedId"),
    studentId: formData.get("studentId"),
    startDate: formData.get("startDate"),
    transferReason: formData.get("transferReason"),
  });
  if (!parsed.success) redirect("/admin/allocations");

  const { bedId, studentId, startDate, transferReason } = parsed.data;

  const start = startDate ? new Date(startDate) : new Date();

  await prisma.$transaction(async (tx) => {
    const existingActive = await tx.allocation.findFirst({
      where: { bedId, endDate: null },
      orderBy: { startDate: "desc" },
      select: { id: true },
    });

    if (existingActive) {
      await tx.allocation.update({
        where: { id: existingActive.id },
        data: { endDate: start, transferReason: transferReason?.trim() || null },
      });
    }

    await tx.allocation.create({
      data: {
        bedId,
        studentId,
        startDate: start,
        transferReason: transferReason?.trim() || null,
      },
    });
  });

  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}

export async function updateTransferReason(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = allocationUpdateSchema.safeParse({
    allocationId: formData.get("allocationId"),
    transferReason: formData.get("transferReason"),
  });
  if (!parsed.success) redirect("/admin/allocations");

  const { allocationId, transferReason } = parsed.data;

  await prisma.allocation.update({
    where: { id: allocationId },
    data: { transferReason: transferReason?.trim() || null },
  });

  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}

export async function deleteAllocation(formData: FormData) {
  await requireRole(allowedRoles);

  const allocationId = z.string().min(1).parse(formData.get("allocationId"));

  await prisma.allocation.delete({ where: { id: allocationId } });
  revalidatePath("/admin/allocations");
  redirect("/admin/allocations");
}

