import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
  progress?: number;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review literature on renewable energy",
    description: "Complete systematic review of papers from 2020-2024",
    assignee: "You",
    dueDate: "Oct 15, 2024",
    priority: "High",
    status: "In Progress",
    progress: 65
  },
  {
    id: "2",
    title: "Data Analysis - Climate Impact",
    description: "Analyze temperature data and create visualizations",
    assignee: "John D.",
    dueDate: "Oct 12, 2024",
    priority: "Medium",
    status: "Pending",
    progress: 0
  },
  {
    id: "3",
    title: "Finalize Chapter 3 Draft",
    description: "Complete writing and formatting of methodology chapter",
    assignee: "You",
    dueDate: "Oct 10, 2024",
    priority: "High",
    status: "Overdue",
    progress: 85
  },
  {
    id: "4",
    title: "Peer Review - Sarah's Paper",
    description: "Review and provide feedback on research paper draft",
    assignee: "You",
    dueDate: "Oct 18, 2024",
    priority: "Low",
    status: "Completed",
    progress: 100
  }
];

const priorityColors = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Low: "bg-green-500/10 text-green-400 border-green-500/20"
};

const statusColors = {
  Pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Completed: "bg-green-500/10 text-green-400 border-green-500/20",
  Overdue: "bg-red-500/10 text-red-400 border-red-500/20"
};

export default function TaskDashboard() {
  const [tasks, setTasks] = useState(mockTasks);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    console.log('Task status changed:', taskId, newStatus);
  };

  const handleCreateTask = () => {
    console.log('Create new task clicked');
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const totalTasks = tasks.length;
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-500">
                  {tasks.filter(t => t.status === "In Progress").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">
                  {tasks.filter(t => t.status === "Overdue").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks & Deadlines</CardTitle>
            <Button onClick={handleCreateTask} size="sm" data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Progress:</span>
            <Progress value={overallProgress} className="flex-1 max-w-xs" />
            <span className="text-sm font-medium">{overallProgress}%</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-4 hover-elevate"
                data-testid={`task-item-${task.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge className={priorityColors[task.priority]} variant="outline">
                        {task.priority}
                      </Badge>
                      <Badge className={statusColors[task.status]} variant="outline">
                        {task.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {task.assignee}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {task.dueDate}
                      </div>
                      {task.progress !== undefined && task.status !== "Completed" && (
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="w-16 h-2" />
                          <span>{task.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-task-menu-${task.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(task.id, "In Progress")}
                        data-testid={`menu-in-progress-${task.id}`}
                      >
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(task.id, "Completed")}
                        data-testid={`menu-completed-${task.id}`}
                      >
                        Mark Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-edit-${task.id}`}>
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        data-testid={`menu-delete-${task.id}`}
                      >
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}