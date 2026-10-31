"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedActorContext } from "@/lib/auth/session";
import { TaskService } from "@/lib/services/task-service";
import { DomainError } from "@/lib/errors";

import { UpdateTaskInput } from "@/lib/validation/task";

export async function createTaskAction(rawInput: {
  title: string;
  description?: string | null;
  assigneeMembershipId: string;
  dueAt?: string | null;
}) {
  try {
    const { actor } = await getVerifiedActorContext();

    const task = await TaskService.createTask(actor, {
      title: rawInput.title,
      description: rawInput.description,
      assigneeMembershipId: rawInput.assigneeMembershipId,
      dueAt: rawInput.dueAt ? new Date(rawInput.dueAt) : null,
      createdVia: "web",
    });

    revalidatePath("/");
    return { success: true as const, task };
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return { success: false as const, error: err.message, code: err.code };
    }
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to create task.",
    };
  }
}

export async function updateTaskAction(
  taskId: string,
  rawUpdates: {
    title?: string;
    description?: string | null;
    assigneeMembershipId?: string;
    dueAt?: string | null;
    status?: UpdateTaskInput["status"];
  }
) {
  try {
    const { actor } = await getVerifiedActorContext();

    const task = await TaskService.updateTask(actor, taskId, {
      ...rawUpdates,
      dueAt: rawUpdates.dueAt ? new Date(rawUpdates.dueAt) : rawUpdates.dueAt,
    });

    revalidatePath("/");
    return { success: true as const, task };
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return { success: false as const, error: err.message, code: err.code };
    }
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to update task.",
    };
  }
}

export async function getTaskHistoryAction(taskId: string) {
  try {
    const { actor } = await getVerifiedActorContext();
    const history = await TaskService.getTaskHistory(actor, taskId);
    return { success: true as const, history };
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return { success: false as const, error: err.message, code: err.code };
    }
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to retrieve history.",
    };
  }
}

