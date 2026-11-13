"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  Plus,
  Calendar,
  User,
  Clock,
  History,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskAction,
  updateTaskAction,
  getTaskHistoryAction,
} from "@/server/actions/task.actions";
import type { UpdateTaskInput } from "@/shared/validation/task.validation";
import type { MembershipRole } from "@/shared/types/auth.types";
import type { TaskItem, MemberItem, HistoryEventItem } from "@/shared/types/task.types";

export type { TaskItem, MemberItem };

interface TaskWorkspaceProps {
  initialTasks: TaskItem[];
  members: MemberItem[];
  currentRole: MembershipRole;
  currentMembershipId: string;
}

export function TaskWorkspace({
  initialTasks,
  members,
  currentRole,
}: TaskWorkspaceProps) {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState(
    members[0]?.membershipId || ""
  );
  const [newDueAt, setNewDueAt] = useState("");

  // Edit task form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editStatus, setEditStatus] = useState<string>("open");

  // Audit history state
  const [historyEvents, setHistoryEvents] = useState<HistoryEventItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Render timestamp anchor
  const now = useMemo(() => new Date().getTime(), []);

  // Global hotkeys inside workspace: [N] for new task, [Esc] to dismiss modal or detail panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isCreateOpen) {
          setIsCreateOpen(false);
        } else if (selectedTask) {
          setSelectedTask(null);
          setHistoryEvents([]);
        }
      } else if (e.key === "n" || e.key === "N") {
        const activeTag = document.activeElement?.tagName;
        if (
          activeTag !== "INPUT" &&
          activeTag !== "TEXTAREA" &&
          activeTag !== "SELECT" &&
          currentRole === "leader" &&
          !isCreateOpen
        ) {
          e.preventDefault();
          setIsCreateOpen(true);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateOpen, selectedTask, currentRole]);

  const handleSelectTask = (task: TaskItem) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditAssigneeId(task.assigneeMembershipId);
    setEditDueAt(
      task.dueAt ? new Date(task.dueAt).toISOString().split("T")[0] : ""
    );
    setEditStatus(task.status);
    setErrorMessage(null);

    setIsHistoryLoading(true);
    getTaskHistoryAction(task.id).then((res) => {
      setIsHistoryLoading(false);
      if (res.success && res.history) {
        setHistoryEvents(res.history as HistoryEventItem[]);
      }
    });
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
    setHistoryEvents([]);
  };

  // Filter tasks
  const filteredTasks = initialTasks.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newTitle.trim()) {
      setErrorMessage("Task title cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await createTaskAction({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        assigneeMembershipId: newAssigneeId,
        dueAt: newDueAt ? new Date(newDueAt).toISOString() : null,
      });

      if (res.success && res.task) {
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewDueAt("");
      } else {
        setErrorMessage(res.error || "Failed to create task.");
      }
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateTaskAction(selectedTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        assigneeMembershipId: editAssigneeId,
        dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
        status: editStatus as UpdateTaskInput["status"],
      });

      if (res.success && res.task) {
        const histRes = await getTaskHistoryAction(selectedTask.id);
        if (histRes.success && histRes.history) {
          setHistoryEvents(histRes.history as HistoryEventItem[]);
        }
      } else {
        setErrorMessage(res.error || "Failed to update task.");
      }
    });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusVariant = (status: string): NonNullable<BadgeProps["variant"]> => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "outline";
      case "cancelled":
        return "destructive";
      case "in_review":
      case "submitted":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isOverdue = (dueAt: Date | string | null, status: string) => {
    if (!dueAt || status === "completed" || status === "cancelled") return false;
    return new Date(dueAt).getTime() < now;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 w-full">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-foreground uppercase">
            Tasks
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-0.5">
            {currentRole === "leader"
              ? "Delegate assignments across your organization team."
              : "Review deliverables assigned to you."}
          </p>
        </div>

        {currentRole === "leader" && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            variant="default"
            className="gap-2 self-start sm:self-auto h-8 px-3 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
            <kbd className="hidden sm:inline border border-neutral-700 dark:border-neutral-300 px-1 text-[9px] text-neutral-300 dark:text-neutral-700">
              N
            </kbd>
          </Button>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-6 flex items-center justify-between border border-foreground bg-muted p-3 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 border border-transparent hover:border-foreground text-neutral-500 hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-3 mb-6 overflow-x-auto text-xs">
        {["all", "open", "in_progress", "submitted", "completed"].map((tab) => {
          const active = statusFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`h-7 px-3 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                active
                  ? "bg-foreground text-background border-foreground font-bold"
                  : "bg-transparent text-neutral-500 border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {formatStatus(tab)}
            </button>
          );
        })}
      </div>

      {/* Main Layout: Task List + Slide Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Task List Column */}
        <div
          className={`${
            selectedTask ? "lg:col-span-7" : "lg:col-span-12"
          } transition-all`}
        >
          {filteredTasks.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center bg-card">
              <Layers className="mx-auto h-7 w-7 text-neutral-400 mb-2.5" />
              <h3 className="text-xs font-mono uppercase font-bold text-foreground">
                No tasks found
              </h3>
              <p className="text-xs font-mono text-neutral-500 mt-1 max-w-sm mx-auto">
                {currentRole === "leader"
                  ? "Create a task using the button above or delegate through your AI assistant."
                  : "You currently have no tasks assigned in this status."}
              </p>
            </div>
          ) : (
            <div className="border border-border bg-card divide-y divide-border">
              {filteredTasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                const overdue = isOverdue(task.dueAt, task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors cursor-pointer border-l-2 ${
                      isSelected
                        ? "bg-muted border-l-foreground"
                        : "border-l-transparent hover:bg-muted/40 hover:border-l-neutral-400"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate font-mono">
                          {task.title}
                        </span>
                        {task.createdVia === "mcp" && (
                          <span
                            title="Created via AI Assistant (MCP)"
                            className="flex items-center gap-1 border border-border bg-muted px-1.5 py-0.5 text-[9px] font-mono uppercase text-foreground"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            MCP
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-neutral-400" />
                          <span>{task.assigneeName}</span>
                        </div>

                        {task.dueAt && (
                          <div
                            className={`flex items-center gap-1 ${
                              overdue ? "text-foreground font-bold" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3 text-neutral-400" />
                            <span>
                              {new Date(task.dueAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {overdue && (
                              <span className="text-[9px] uppercase font-bold border border-foreground px-1 bg-foreground text-background">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge variant={getStatusVariant(task.status)}>
                        {formatStatus(task.status)}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Task Detail Panel */}
        {selectedTask && (
          <div className="lg:col-span-5 border border-border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500">
                  Task Detail
                </span>
                {selectedTask.createdVia === "mcp" && (
                  <Badge variant="default" className="text-[9px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    MCP Created
                  </Badge>
                )}
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1 border border-transparent hover:border-foreground text-neutral-500 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={currentRole !== "leader" || isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Instructions & Deliverables
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={currentRole !== "leader" || isPending}
                  rows={3}
                  placeholder="No instructions provided."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-foreground">
                    Assignee
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    disabled={currentRole !== "leader" || isPending}
                    className="flex h-9 w-full rounded-none border border-border bg-background px-3 py-1 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:border-foreground"
                  >
                    {members.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-foreground">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-none border border-border bg-background px-3 py-1 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:border-foreground"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editDueAt}
                  onChange={(e) => setEditDueAt(e.target.value)}
                  disabled={currentRole !== "leader" || isPending}
                />
              </div>

              {currentRole === "leader" && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="w-full gap-2 h-8 text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Changes
                </Button>
              )}
            </form>

            {/* Audit History Timeline */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-foreground">
                <History className="h-3.5 w-3.5 text-neutral-400" />
                <span>Task History & Audit Log</span>
              </div>

              {isHistoryLoading ? (
                <p className="text-xs font-mono text-neutral-500">
                  Loading history...
                </p>
              ) : historyEvents.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500">
                  No history recorded.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {historyEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="border border-border bg-muted/30 p-2.5 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between text-neutral-500">
                        <span className="font-bold text-foreground uppercase text-[11px]">
                          {evt.eventType.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {new Date(evt.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Actor:{" "}
                        <span className="font-semibold text-foreground">
                          {evt.actorName || "System / Integration"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-foreground bg-background p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground">
                Create New Task
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 border border-transparent hover:border-foreground text-neutral-500 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Task Title *
                </label>
                <Input
                  placeholder="e.g. Confirm catering contract"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Assignee *
                </label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-none border border-border bg-background px-3 py-1 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:border-foreground"
                  required
                >
                  {members.map((m) => (
                    <option key={m.membershipId} value={m.membershipId}>
                      {m.displayName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Instructions / Deliverable (Optional)
                </label>
                <Textarea
                  placeholder="Detailed instructions for the assigned member..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground">
                  Due Date (Optional)
                </label>
                <Input
                  type="date"
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                  <kbd className="ml-1 text-[8px] text-neutral-400">Esc</kbd>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-8 px-3 text-xs"
                >
                  {isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
