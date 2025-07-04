// src/components/TaskItem.js
import React from "react";
import { format, parseISO } from "date-fns"; // For date formatting

const TaskItem = ({ task, onEdit, onDelete, onToggleComplete }) => {
  // Determine priority class for styling
  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
        return "priority-low";
      default:
        return "";
    }
  };

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      {task.dueDate && (
        <p>Due: {format(parseISO(task.dueDate), "PPP")}</p> // Formats date nicely
      )}
      <p>
        Priority:{" "}
        <span className={getPriorityClass(task.priority)}>{task.priority}</span>
      </p>
      {task.reminder && (
        <p>Reminder: {format(parseISO(task.reminder), "PPpp")}</p> // Formats date and time
      )}
      <p>Status: {task.completed ? "Completed" : "Pending"}</p>

      <div className="task-actions">
        <button
          className="btn btn-toggle-complete"
          onClick={() => onToggleComplete(task._id)}
        >
          {task.completed ? "Mark as Pending" : "Mark as Complete"}
        </button>
        <button className="btn btn-edit" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
