import AccountProfileForm from '@/components/auth/AccountProfileForm';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { formatDateOnly } from '@/lib/format';
import { requireStudentContext } from '@/lib/student';
import { BedDouble, UserCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
	const { user, student, activeAllocation } = await requireStudentContext();

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">My Profile</h1>
					<p className="page-subtitle">
						Update your name, login email, and password.
					</p>
				</div>
				<Badge
					variant="success"
					className="h-fit"
				>
					{student.studentNumber}
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
								<UserCircle className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Account Settings</CardTitle>
								<CardDescription>
									Changes are saved to PostgreSQL immediately.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<AccountProfileForm
							name={user.name}
							email={user.email}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
								<BedDouble className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Student Record</CardTitle>
								<CardDescription>Hostel identity details</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex items-center justify-between gap-3">
							<span className="text-slate-400">Student number</span>
							<span className="font-semibold text-white">
								{student.studentNumber}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-slate-400">Program</span>
							<span className="text-slate-200">
								{student.program ?? 'Not set'}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-slate-400">Admission date</span>
							<span className="text-slate-200">
								{student.admissionDate
									? formatDateOnly(student.admissionDate)
									: 'Not set'}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-slate-400">Room</span>
							<span className="text-slate-200">
								{activeAllocation
									? `${activeAllocation.bed.room.building} ${activeAllocation.bed.room.roomNumber} · Bed ${activeAllocation.bed.bedNumber}`
									: 'Not allocated'}
							</span>
						</div>
						<p className="pt-2 text-xs text-slate-500">
							Student number, program, and room are managed by hostel staff.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
