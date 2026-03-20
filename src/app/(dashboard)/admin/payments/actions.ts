"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const invoiceCreateSchema = z.object({
  studentId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  dueDate: z.string().min(1),
  amountDue: z.coerce.number().min(0.01),
});

const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaid: z.coerce.number().min(0.01),
  paymentDate: z.string().optional().nullable(),
  method: z.string().min(1),
  reference: z.string().optional().nullable(),
});

export async function createInvoice(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = invoiceCreateSchema.safeParse({
    studentId: formData.get("studentId"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    dueDate: formData.get("dueDate"),
    amountDue: formData.get("amountDue"),
  });
  if (!parsed.success) redirect("/admin/payments");

  const { studentId, periodStart, periodEnd, dueDate, amountDue } = parsed.data;

  await prisma.invoice.create({
    data: {
      studentId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      dueDate: new Date(dueDate),
      amountDue: amountDue,
      status: "PENDING",
    },
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

export async function recordPayment(formData: FormData) {
  await requireRole(allowedRoles);

  const parsed = paymentCreateSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountPaid: formData.get("amountPaid"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) redirect("/admin/payments");

  const { invoiceId, amountPaid, paymentDate, method, reference } = parsed.data;
  const paidAt = paymentDate ? new Date(paymentDate) : new Date();

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return;

    await tx.payment.create({
      data: {
        invoiceId,
        amountPaid,
        paymentDate: paidAt,
        method,
        reference: reference?.trim() || null,
      },
    });

    const totalPaid = await tx.payment.aggregate({
      where: { invoiceId },
      _sum: { amountPaid: true },
    });

    const total = Number(totalPaid._sum.amountPaid ?? 0);
    const due = Number(invoice.amountDue);

    const isPaid = total >= due - 0.001;
    const now = new Date();
    const status = isPaid
      ? "PAID"
      : invoice.dueDate < now
        ? "OVERDUE"
        : "PENDING";

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

