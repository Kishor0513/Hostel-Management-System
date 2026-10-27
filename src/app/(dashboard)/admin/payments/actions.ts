"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { resolveInvoiceStatus } from "@/lib/invoices";
import type { UserRole } from "@/generated/prisma/enums";

const allowedRoles: UserRole[] = ["ADMIN", "STAFF"];

const invoiceCreateSchema = z.object({
  studentId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  dueDate: z.string().min(1),
  amountDue: z.coerce.number().min(0.01).max(1_000_000),
});

const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaid: z.coerce.number().min(0.01).max(1_000_000),
  paymentDate: z.string().optional().nullable(),
  method: z.string().trim().min(1).max(80),
  reference: z.string().trim().max(120).optional().nullable(),
});

export async function createInvoice(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = invoiceCreateSchema.safeParse({
    studentId: formData.get("studentId"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    dueDate: formData.get("dueDate"),
    amountDue: formData.get("amountDue"),
  });
  if (!parsed.success) redirect("/admin/payments?error=invalid");

  const { studentId, periodStart, periodEnd, dueDate, amountDue } = parsed.data;
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const due = new Date(dueDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    Number.isNaN(due.getTime()) ||
    start >= end ||
    due < start
  ) {
    redirect("/admin/payments?error=dates");
  }

  let invoiceId: string;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        studentId,
        periodStart: start,
        periodEnd: end,
        dueDate: due,
        amountDue,
        status: resolveInvoiceStatus("PENDING", due),
      },
      select: { id: true },
    });
    invoiceId = invoice.id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/payments?error=duplicate");
    }
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "invoice.create",
    entityType: "Invoice",
    entityId: invoiceId,
    metadata: { studentId, periodStart, periodEnd, dueDate, amountDue },
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

export async function recordPayment(formData: FormData) {
  const actor = await requireRole(allowedRoles);

  const parsed = paymentCreateSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amountPaid: formData.get("amountPaid"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) redirect("/admin/payments?error=invalid");

  const { invoiceId, amountPaid, paymentDate, method, reference } = parsed.data;
  const paidAt = paymentDate ? new Date(paymentDate) : new Date();

  if (
    Number.isNaN(paidAt.getTime()) ||
    paidAt.getTime() > Date.now() + 24 * 60 * 60 * 1000
  ) {
    redirect("/admin/payments?error=dates");
  }

  let result;

  try {
    result = await prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true },
        });
        if (!invoice) {
          return { ok: false as const, reason: "missing" };
        }

        const alreadyPaid = invoice.payments.reduce(
          (sum, payment) => sum + Number(payment.amountPaid),
          0,
        );
        const outstanding = Number(invoice.amountDue) - alreadyPaid;

        if (amountPaid > outstanding + 0.001) {
          return { ok: false as const, reason: "overpayment" };
        }

        const payment = await tx.payment.create({
          data: {
            invoiceId,
            amountPaid,
            paymentDate: paidAt,
            method,
            reference: reference || null,
          },
          select: { id: true },
        });

        const totalPaid = alreadyPaid + amountPaid;
        const isPaid = totalPaid >= Number(invoice.amountDue) - 0.001;
        const status = isPaid
          ? "PAID"
          : resolveInvoiceStatus("PENDING", invoice.dueDate);

        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status },
        });

        return { ok: true as const, paymentId: payment.id, status, amountPaid };
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2034") {
      redirect("/admin/payments?error=conflict");
    }
    throw error;
  }

  if (!result.ok) {
    redirect(
      result.reason === "overpayment"
        ? "/admin/payments?error=overpayment"
        : "/admin/payments?error=missing",
    );
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "payment.record",
    entityType: "Payment",
    entityId: result.paymentId,
    metadata: {
      invoiceId,
      amountPaid: result.amountPaid,
      method,
      invoiceStatus: result.status,
    },
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}
