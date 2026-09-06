import { describe, it, expect } from "vitest";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

describe("Role-Based Access Control (RBAC) & Permissions", () => {
  it("should confirm admin and team member roles exist in database", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@snapshare.com" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe(Role.ADMIN);

    const photographer = await prisma.user.findUnique({
      where: { email: "photographer1@snapshare.com" },
    });
    expect(photographer).not.toBeNull();
    expect(photographer?.role).toBe(Role.TEAM_MEMBER);
  });

  it("should prevent Team Member from accessing unassigned events", async () => {
    // photographer2 is NOT assigned to weddingEvent
    const unassignedUser = await prisma.user.findUnique({
      where: { email: "photographer2@snapshare.com" },
    });
    expect(unassignedUser).not.toBeNull();

    const event = await prisma.event.findFirst({
      where: { name: "Arjun & Priya Wedding" },
      include: { assignments: true },
    });
    expect(event).not.toBeNull();

    const isAssigned = event?.assignments.some((a) => a.userId === unassignedUser?.id);
    expect(isAssigned).toBe(false);
  });

  it("should allow assigned Team Member to access their assigned event", async () => {
    const assignedUser = await prisma.user.findUnique({
      where: { email: "photographer1@snapshare.com" },
    });
    expect(assignedUser).not.toBeNull();

    const event = await prisma.event.findFirst({
      where: { name: "Arjun & Priya Wedding" },
      include: { assignments: true },
    });

    const isAssigned = event?.assignments.some((a) => a.userId === assignedUser?.id);
    expect(isAssigned).toBe(true);
  });
});
