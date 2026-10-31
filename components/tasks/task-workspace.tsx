"use client";

import { useState, useTransition, useMemo } from "react";
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
} from "@/app/actions/tasks";
import { UpdateTaskInput } from "@/lib/validation/task";
import { MembershipRole } from "@/lib/types/auth";

export interface TaskItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  assigneeMembershipId: string;
  createdByMembershipId: string;
  dueAt: Date | string | null;
  status: string;
  createdVia: "web" | "mcp";
  createdAt: Date | string;
  updatedAt: Date | string;
  assigneeName: string;
}

export interface MemberItem {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  role: MembershipRole;
}

interface HistoryEventItem {
  id: string;
  taskId: string;
  actorMembershipId: string | null;
  eventType: string;
  details: unknown;
  createdAt: Date | string;
  actorName: string | null;
}

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
        return "success";
      case "in_progress":
        return "warning";
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Task Execution
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentRole === "leader"
              ? "Delegate and manage assignments across your organization team."
              : "Review instructions and update your assigned deliverables."}
          </p>
        </div>

        {currentRole === "leader" && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="rounded p-1 hover:bg-destructive/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 pb-2 mb-6 overflow-x-auto text-xs border-b border-border">
        {["all", "open", "in_progress", "submitted", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              statusFilter === tab
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {formatStatus(tab)}
          </button>
        ))}
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
            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
              <Layers className="mx-auto h-7 w-7 text-muted-foreground/50 mb-2.5" />
              <h3 className="text-sm font-medium text-foreground">
                No tasks found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {currentRole === "leader"
                  ? "Create a task using the button above or delegate through your AI assistant."
                  : "You currently have no tasks assigned in this status."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              {filteredTasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                const overdue = isOverdue(task.dueAt, task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-muted/70"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {task.title}
                        </span>
                        {task.createdVia === "mcp" && (
                          <span
                            title="Created via AI Assistant (MCP)"
                            className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            MCP
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground/70" />
                          <span>{task.assigneeName}</span>
                        </div>

                        {task.dueAt && (
                          <div
                            className={`flex items-center gap-1 ${
                              overdue
                                ? "text-rose-600 font-medium dark:text-rose-400"
                                : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3 text-muted-foreground/70" />
                            <span>
                              {new Date(task.dueAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {overdue && (
                              <span className="text-[10px] uppercase font-semibold">
                                (Overdue)
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
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Task Detail Panel */}
        {selectedTask && (
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Detail
                </span>
                {selectedTask.createdVia === "mcp" && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    MCP Created
                  </Badge>
                )}
              </div>
              <button
                onClick={handleCloseDetail}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
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
                <label className="text-xs font-medium text-foreground">
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
                  <label className="text-xs font-medium text-foreground">
                    Assignee
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    disabled={currentRole !== "leader" || isPending}
                    className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {members.map((m) => (
                      <option key={m.membershipId} value={m.membershipId}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                <label className="text-xs font-medium text-foreground">
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
                  className="w-full gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Changes
                </Button>
              )}
            </form>

            {/* Audit History Timeline */}
            <div className="pt-4 border-t border-border/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Task History & Audit Log</span>
              </div>

              {isHistoryLoading ? (
                <p className="text-xs text-muted-foreground">
                  Loading history...
                </p>
              ) : historyEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No history recorded.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {historyEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-medium text-foreground capitalize">
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
                      <div className="text-[11px] text-muted-foreground">
                        Actor:{" "}
                        <span className="font-medium text-foreground">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Create New Task
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
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
                <label className="text-xs font-medium text-foreground">
                  Assignee *
                </label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                <label className="text-xs font-medium text-foreground">
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
                <label className="text-xs font-medium text-foreground">
                  Due Date (Optional)
                </label>
                <Input
                  type="date"
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
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
