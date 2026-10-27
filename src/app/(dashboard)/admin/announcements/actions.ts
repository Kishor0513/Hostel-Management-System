"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const announcementCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(1).max(20_000),
  isPublished: z.string().optional().nullable(),
});

const announcementDeleteSchema = z.object({
  announcementId: z.string().min(1),
});

export async function createAnnouncement(formData: FormData) {
  const actor = await requireRole(["ADMIN"]);

  const parsed = announcementCreateSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    isPublished: formData.get("isPublished"),
  });
  if (!parsed.success) redirect("/admin/announcements?error=invalid");

  const { title, content, isPublished } = parsed.data;
  const publish =
    isPublished === "1" || isPublished === "on" || isPublished === "true";

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      isPublished: publish,
      publishedAt: publish ? new Date() : null,
      createdByUserId: actor.id,
    },
    select: { id: true },
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "announcement.create",
    entityType: "Announcement",
    entityId: announcement.id,
    metadata: { title, isPublished: publish },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
  revalidatePath("/announcements");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  const actor = await requireRole(["ADMIN"]);

  const parsed = announcementDeleteSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });
  if (!parsed.success) redirect("/admin/announcements?error=invalid");

  const announcement = await prisma.announcement.findUnique({
    where: { id: parsed.data.announcementId },
    select: { id: true, title: true, isPublished: true },
  });

  if (!announcement) {
    redirect("/admin/announcements");
  }

  await prisma.announcement.delete({ where: { id: announcement.id } });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "announcement.delete",
    entityType: "Announcement",
    entityId: announcement.id,
    metadata: {
      title: announcement.title,
      isPublished: announcement.isPublished,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
  revalidatePath("/announcements");
  redirect("/admin/announcements");
}
