import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TaskDashboard from "@/components/TaskDashboard";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1">
          <TaskDashboard />
        </main>
      </div>
    </div>
  );
}
