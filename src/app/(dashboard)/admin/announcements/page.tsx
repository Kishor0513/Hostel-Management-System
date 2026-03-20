import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { createAnnouncement as createAnnouncementAction, deleteAnnouncement as deleteAnnouncementAction } from "./actions";

export default async function AdminAnnouncementsPage() {
  await requireRole(["ADMIN"]);

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>Publish a notice for students and staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAnnouncementAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                name="content"
                required
                className="min-h-[120px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
              />
            </div>
            <div className="flex items-center gap-3">
              <input id="isPublished" name="isPublished" type="checkbox" value="1" className="h-4 w-4 accent-white" />
              <Label htmlFor="isPublished">Publish now</Label>
            </div>

            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Feed</CardTitle>
          <CardDescription>Delete removes the notice entirely.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[140px]">Published</TableHead>
                <TableHead className="w-[160px]">Created</TableHead>
                <TableHead className="w-[120px]">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-white/90">{a.title}</div>
                      <div className="text-xs text-white/50 line-clamp-2">{a.content}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.isPublished ? "success" : "warning"}>
                      {a.isPublished ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.createdAt.toISOString().slice(0, 10)}</TableCell>
                  <TableCell>
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="announcementId" value={a.id} />
                      <Button type="submit" variant="destructive" className="h-9 w-full px-2">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-white/60">
                    No announcements yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

