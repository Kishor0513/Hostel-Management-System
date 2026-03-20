"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { type UserRole } from "@/generated/prisma/enums";

const roomCreateSchema = z.object({
  building: z.string().min(1),
  floor: z.coerce.number().int(),
  roomNumber: z.string().min(1),
  capacityBeds: z.coerce.number().int().positive(),
});

const roomUpdateSchema = z.object({
  roomId: z.string().min(1),
  building: z.string().min(1),
  floor: z.coerce.number().int(),
  roomNumber: z.string().min(1),
  capacityBeds: z.coerce.number().int().positive(),
});

const roomDeleteSchema = z.object({
  roomId: z.string().min(1),
});

function pickRole() {
  return ["ADMIN", "STAFF"] satisfies UserRole[];
}

export async function createRoom(formData: FormData) {
  await requireRole(pickRole());

  const parsed = roomCreateSchema.safeParse({
    building: formData.get("building"),
    floor: formData.get("floor"),
    roomNumber: formData.get("roomNumber"),
    capacityBeds: formData.get("capacityBeds"),
  });
  if (!parsed.success) redirect("/admin/rooms");

  const { building, floor, roomNumber, capacityBeds } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const room = await tx.room.create({
      data: {
        building,
        floor,
        roomNumber,
        capacityBeds,
      },
    });

    const beds = Array.from({ length: capacityBeds }, (_, i) => ({
      roomId: room.id,
      bedNumber: i + 1,
    }));
    await tx.bed.createMany({ data: beds });
  });

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function updateRoom(formData: FormData) {
  await requireRole(pickRole());

  const parsed = roomUpdateSchema.safeParse({
    roomId: formData.get("roomId"),
    building: formData.get("building"),
    floor: formData.get("floor"),
    roomNumber: formData.get("roomNumber"),
    capacityBeds: formData.get("capacityBeds"),
  });
  if (!parsed.success) redirect("/admin/rooms");

  const { roomId, building, floor, roomNumber, capacityBeds } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: roomId }, include: { beds: true } });
    if (!room) return;

    await tx.room.update({
      where: { id: roomId },
      data: {
        building,
        floor,
        roomNumber,
        capacityBeds,
      },
    });

    const existingBedCount = room.beds.length;
    if (capacityBeds > existingBedCount) {
      const beds = Array.from({ length: capacityBeds - existingBedCount }, (_, i) => ({
        roomId,
        bedNumber: existingBedCount + i + 1,
      }));
      await tx.bed.createMany({ data: beds });
    }
  });

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function deleteRoom(formData: FormData) {
  await requireRole(pickRole());

  const parsed = roomDeleteSchema.safeParse({
    roomId: formData.get("roomId"),
  });
  if (!parsed.success) redirect("/admin/rooms");

  await prisma.room.delete({ where: { id: parsed.data.roomId } });
  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

