import { useState } from "react";

export default function TaskDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Track and manage your project tasks
          </p>
        </div>
      </div>

      <div className="text-center py-8 space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Task Dashboard</h3>
          <p className="text-muted-foreground mb-4">
            Task management functionality coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
