import Sidebar from "@/components/Sidebar";
import TaskDashboard from "@/components/TaskDashboard";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">
          <TaskDashboard />
        </main>
      </div>
    </div>
  );
}
