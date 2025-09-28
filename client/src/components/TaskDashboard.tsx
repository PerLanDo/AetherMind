import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string | null;
  createdBy: string;
  projectId: string;
  dueDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  assigneeName?: string;
  creatorName?: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
  dueDate: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200",
  urgent: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function TaskDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for project selection
  const { data: projects = [] } = useQuery({
    queryKey: ["api", "projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Fetch tasks for selected project
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["api", "projects", selectedProject, "tasks"],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/tasks`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["api", "projects", selectedProject, "members"],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/members`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedProject,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const response = await fetch(`/api/projects/${selectedProject}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["api", "projects", selectedProject, "tasks"],
      });
      setIsCreateDialogOpen(false);
      toast({ title: "Task created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      progress,
    }: {
      taskId: string;
      status: string;
      progress?: number;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, progress }),
      });
      if (!response.ok) throw new Error("Failed to update task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["api", "projects", selectedProject, "tasks"],
      });
      toast({ title: "Task updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  // Filter tasks based on status and search
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group tasks by status for kanban view
  const tasksByStatus = {
    pending: filteredTasks.filter((task: Task) => task.status === "pending"),
    in_progress: filteredTasks.filter(
      (task: Task) => task.status === "in_progress"
    ),
    completed: filteredTasks.filter(
      (task: Task) => task.status === "completed"
    ),
    overdue: filteredTasks.filter((task: Task) => task.status === "overdue"),
  };

  // Set first project as selected if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const taskData: CreateTaskData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string,
      assignedTo: formData.get("assignedTo") as string,
      dueDate: formData.get("dueDate") as string,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const progressMap = {
      pending: 0,
      in_progress: 50,
      completed: 100,
      overdue: 0,
    };

    updateTaskMutation.mutate({
      taskId,
      status: newStatus,
      progress: progressMap[newStatus as keyof typeof progressMap],
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return (
      new Date(dueDate) < new Date() &&
      new Date().getTime() - new Date(dueDate).getTime() > 24 * 60 * 60 * 1000
    );
  };

  if (!selectedProject) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8 space-y-4">
          <h3 className="text-lg font-medium">No Project Selected</h3>
          <p className="text-muted-foreground">
            Please select or create a project to manage tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Track and manage your project tasks
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your project
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Task description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assign To</Label>
                      <Select name="assignedTo">
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending
                      ? "Creating..."
                      : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-6">
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <div key={status} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">
                      {status.replace("_", " ")}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {statusTasks.map((task: Task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm leading-tight">
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(task.id, "pending")
                                  }
                                >
                                  Set Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(task.id, "in_progress")
                                  }
                                >
                                  Set In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(task.id, "completed")
                                  }
                                >
                                  Mark Complete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                priorityColors[
                                  task.priority as keyof typeof priorityColors
                                ]
                              }`}
                            >
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  isOverdue(task.dueDate)
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(task.dueDate)}
                              </Badge>
                            )}
                          </div>

                          {task.assigneeName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {task.assigneeName}
                            </div>
                          )}

                          {task.progress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No {status.replace("_", " ")} tasks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <h3 className="text-lg font-medium">No Tasks Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Create your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task: Task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              statusColors[
                                task.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {task.status.replace("_", " ")}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={
                              priorityColors[
                                task.priority as keyof typeof priorityColors
                              ]
                            }
                          >
                            {task.priority}
                          </Badge>

                          {task.dueDate && (
                            <Badge
                              variant="outline"
                              className={`${
                                isOverdue(task.dueDate)
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(task.dueDate)}
                            </Badge>
                          )}

                          {task.assigneeName && (
                            <Badge variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              {task.assigneeName}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task.id, "pending")
                            }
                          >
                            Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task.id, "in_progress")
                            }
                          >
                            Set In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task.id, "completed")
                            }
                          >
                            Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.progress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="text-center py-8 space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Calendar View</h3>
            <p className="text-muted-foreground">
              Calendar view coming soon. Tasks will be displayed by due date.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
