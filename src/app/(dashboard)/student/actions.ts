'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireStudentContext } from '@/lib/student';

const requestSchema = z.object({
	title: z.string().trim().min(3).max(140),
	description: z.string().trim().min(10).max(4000),
	priority: z.coerce.number().int().min(1).max(3).default(2),
});

function parseRequest(formData: FormData, field: 'subject' | 'title') {
	return requestSchema.safeParse({
		title: formData.get(field),
		description: formData.get('description'),
		priority: formData.get('priority') ?? 2,
	});
}

export async function createMyComplaint(formData: FormData) {
	const { user, student, activeAllocation } = await requireStudentContext();

	const parsed = parseRequest(formData, 'subject');
	if (!parsed.success) {
		redirect('/student/requests?error=invalid&tab=complaints');
	}

	const { title, description, priority } = parsed.data;

	const ticket = await prisma.$transaction(async (tx) => {
		const created = await tx.complaintTicket.create({
			data: {
				subject: title,
				description,
				status: 'OPEN',
				priority,
				studentId: student.id,
				roomId: activeAllocation?.bed.roomId ?? null,
				createdByUserId: user.id,
			},
		});

		await tx.complaintLog.create({
			data: {
				ticketId: created.id,
				status: 'OPEN',
				comment: 'Created by student',
				changedByUserId: user.id,
			},
		});

		return created;
	});

	await writeAuditLog({
		actorUserId: user.id,
		action: 'complaint.create',
		entityType: 'ComplaintTicket',
		entityId: ticket.id,
		metadata: { priority, roomId: activeAllocation?.bed.roomId ?? null },
	});

	revalidatePath('/student');
	revalidatePath('/student/requests');
	revalidatePath('/admin/complaints');
	redirect('/student/requests?saved=complaint&tab=complaints');
}

export async function createMyMaintenanceRequest(formData: FormData) {
	const { user, student, activeAllocation } = await requireStudentContext();

	const parsed = parseRequest(formData, 'title');
	if (!parsed.success) {
		redirect('/student/requests?error=invalid&tab=maintenance');
	}

	const { title, description, priority } = parsed.data;

	const request = await prisma.$transaction(async (tx) => {
		const created = await tx.maintenanceRequest.create({
			data: {
				title,
				description,
				status: 'OPEN',
				priority,
				studentId: student.id,
				roomId: activeAllocation?.bed.roomId ?? null,
				createdByUserId: user.id,
			},
		});

		await tx.maintenanceLog.create({
			data: {
				requestId: created.id,
				status: 'OPEN',
				comment: 'Created by student',
				changedByUserId: user.id,
			},
		});

		return created;
	});

	await writeAuditLog({
		actorUserId: user.id,
		action: 'maintenance.create',
		entityType: 'MaintenanceRequest',
		entityId: request.id,
		metadata: { priority, roomId: activeAllocation?.bed.roomId ?? null },
	});

	revalidatePath('/student');
	revalidatePath('/student/requests');
	revalidatePath('/admin/maintenance');
	redirect('/student/requests?saved=maintenance&tab=maintenance');
}
