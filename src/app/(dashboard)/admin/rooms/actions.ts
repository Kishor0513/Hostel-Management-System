"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { type UserRole } from "@/generated/prisma/enums";

const roomCreateSchema = z.object({
  building: z.string().trim().min(1).max(80),
  floor: z.coerce.number().int().min(0).max(200),
  roomNumber: z.string().trim().min(1).max(40),
  capacityBeds: z.coerce.number().int().positive().max(100),
});

const roomUpdateSchema = z.object({
  roomId: z.string().min(1),
  building: z.string().trim().min(1).max(80),
  floor: z.coerce.number().int().min(0).max(200),
  roomNumber: z.string().trim().min(1).max(40),
  capacityBeds: z.coerce.number().int().positive().max(100),
});

const roomDeleteSchema = z.object({
  roomId: z.string().min(1),
});

function pickRole() {
  return ["ADMIN", "STAFF"] satisfies UserRole[];
}

export async function createRoom(formData: FormData) {
  const actor = await requireRole(pickRole());

  const parsed = roomCreateSchema.safeParse({
    building: formData.get("building"),
    floor: formData.get("floor"),
    roomNumber: formData.get("roomNumber"),
    capacityBeds: formData.get("capacityBeds"),
  });
  if (!parsed.success) redirect("/admin/rooms?error=invalid");

  const { building, floor, roomNumber, capacityBeds } = parsed.data;

  let roomId: string;

  try {
    roomId = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          building,
          floor,
          roomNumber,
          capacityBeds,
        },
        select: { id: true },
      });

      const beds = Array.from({ length: capacityBeds }, (_, i) => ({
        roomId: room.id,
        bedNumber: i + 1,
      }));
      await tx.bed.createMany({ data: beds });

      return room.id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/rooms?error=duplicate");
    }
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "room.create",
    entityType: "Room",
    entityId: roomId,
    metadata: { building, floor, roomNumber, capacityBeds },
  });

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function updateRoom(formData: FormData) {
  const actor = await requireRole(pickRole());

  const parsed = roomUpdateSchema.safeParse({
    roomId: formData.get("roomId"),
    building: formData.get("building"),
    floor: formData.get("floor"),
    roomNumber: formData.get("roomNumber"),
    capacityBeds: formData.get("capacityBeds"),
  });
  if (!parsed.success) redirect("/admin/rooms?error=invalid");

  const { roomId, building, floor, roomNumber, capacityBeds } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { beds: true },
      });
      if (!room) return false;

      if (capacityBeds < room.beds.length) {
        return "capacity-below-beds" as const;
      }

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
        const beds = Array.from(
          { length: capacityBeds - existingBedCount },
          (_, i) => ({
            roomId,
            bedNumber: existingBedCount + i + 1,
          }),
        );
        await tx.bed.createMany({ data: beds });
      }

      return true;
    });

    if (updated === "capacity-below-beds") {
      redirect("/admin/rooms?error=capacity");
    }
    if (!updated) {
      redirect("/admin/rooms");
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      redirect("/admin/rooms?error=duplicate");
    }
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: "room.update",
    entityType: "Room",
    entityId: roomId,
    metadata: { building, floor, roomNumber, capacityBeds },
  });

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}

export async function deleteRoom(formData: FormData) {
  const actor = await requireRole(pickRole());

  const parsed = roomDeleteSchema.safeParse({
    roomId: formData.get("roomId"),
  });
  if (!parsed.success) redirect("/admin/rooms?error=invalid");

  const room = await prisma.room.findUnique({
    where: { id: parsed.data.roomId },
    select: {
      id: true,
      building: true,
      roomNumber: true,
      _count: {
        select: {
          beds: { where: { allocations: { some: {} } } },
          maintenanceRequests: true,
          complaintTickets: true,
        },
      },
    },
  });

  if (!room) {
    redirect("/admin/rooms");
  }

  if (
    room._count.beds > 0 ||
    room._count.maintenanceRequests > 0 ||
    room._count.complaintTickets > 0
  ) {
    redirect("/admin/rooms?error=has-history");
  }

  await prisma.room.delete({ where: { id: room.id } });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "room.delete",
    entityType: "Room",
    entityId: room.id,
    metadata: { building: room.building, roomNumber: room.roomNumber },
  });

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms");
}
