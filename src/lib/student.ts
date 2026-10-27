import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireStudentContext() {
	const user = await requireRole(['STUDENT']);

	const student = await prisma.student.findUnique({
		where: { userId: user.id },
		include: {
			allocations: {
				where: { endDate: null },
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					bed: {
						include: {
							room: true,
						},
					},
				},
			},
		},
	});

	if (!student) {
		redirect('/forbidden');
	}

	return {
		user,
		student,
		activeAllocation: student.allocations[0] ?? null,
	};
}
