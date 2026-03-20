"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const announcementCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isPublished: z.string().optional().nullable(),
});

const announcementDeleteSchema = z.object({
  announcementId: z.string().min(1),
});

export async function createAnnouncement(formData: FormData) {
  await requireRole(["ADMIN"]);

  const parsed = announcementCreateSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    isPublished: formData.get("isPublished"),
  });
  if (!parsed.success) redirect("/admin/announcements");

  const { title, content, isPublished } = parsed.data;
  const publish = Boolean(isPublished);

  const user = await requireRole(["ADMIN"]);

  await prisma.announcement.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      isPublished: publish,
      publishedAt: publish ? new Date() : null,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireRole(["ADMIN"]);

  const parsed = announcementDeleteSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });
  if (!parsed.success) redirect("/admin/announcements");

  await prisma.announcement.delete({ where: { id: parsed.data.announcementId } });

  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}

