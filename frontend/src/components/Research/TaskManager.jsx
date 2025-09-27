import React, { useState, useEffect } from "react";
import researchAPI from "../../../api/researchAPI";
import TaskItem from "./TaskItem";
import CreateTaskModal from "./CreateTaskModal";
import "./TaskManager.css";

const TaskManager = ({ projectId }) => {
  const [tasks, setTasks] = useState([]); // Empty array instead of placeholder tasks
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await researchAPI.getProjectTasks(projectId);
      setTasks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  };

  const renderEmptyState = () => (
    <div className="tasks-empty-state">
      <div className="empty-icon">✅</div>
      <h3>No tasks created yet</h3>
      <p>Create tasks to organize your research workflow and track progress.</p>
      <button
        className="create-task-button primary"
        onClick={() => setShowCreateTask(true)}
      >
        ➕ Create First Task
      </button>
      <div className="task-suggestions">
        <small>
          Suggestions: Literature review, Data collection, Analysis, Writing
        </small>
      </div>
    </div>
  );

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const pending = tasks.filter((task) => task.status === "pending").length;

    return { total, completed, inProgress, pending };
  };

  const stats = getTaskStats();

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h3>Task Management</h3>
        {tasks.length > 0 && (
          <div className="task-stats">
            <span className="stat">Total: {stats.total}</span>
            <span className="stat completed">Done: {stats.completed}</span>
            <span className="stat in-progress">
              In Progress: {stats.inProgress}
            </span>
            <span className="stat pending">Pending: {stats.pending}</span>
          </div>
        )}
        {tasks.length > 0 && (
          <button
            className="create-task-button"
            onClick={() => setShowCreateTask(true)}
          >
            ➕ New Task
          </button>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="task-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All Tasks
          </button>
          <button
            className={filter === "pending" ? "active" : ""}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={filter === "in_progress" ? "active" : ""}
            onClick={() => setFilter("in_progress")}
          >
            In Progress
          </button>
          <button
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      )}

      <div className="tasks-container">
        {tasks.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <TaskItem key={task._id} task={task} onUpdate={fetchTasks} />
            ))}
          </div>
        )}
      </div>

      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default TaskManager;
