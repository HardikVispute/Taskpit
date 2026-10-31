import { describe, it, expect } from "vitest";
import { z } from "zod";
import { tasks, organizations } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

describe("Slice 0: Foundation Smoke Test", () => {
  it("executes basic assertions in Vitest harness", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves @/* path aliases and utilities", () => {
    const className = cn("text-sm", true && "font-bold", false && "hidden");
    expect(className).toBe("text-sm font-bold");
  });

  it("validates runtime schemas with Zod", () => {
    const testSchema = z.object({
      title: z.string().min(1),
      dueAt: z.date().optional(),
    });

    const parsed = testSchema.safeParse({ title: "Coordinate Meeting" });
    expect(parsed.success).toBe(true);

    const invalid = testSchema.safeParse({ title: "" });
    expect(invalid.success).toBe(false);
  });

  it("imports Drizzle schema definitions without database connection", () => {
    expect(tasks).toBeDefined();
    expect(organizations).toBeDefined();
    expect(tasks.title).toBeDefined();
  });
});
