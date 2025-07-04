// src/pages/TasksPage.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import TaskItem from "../components/TaskItem";
import { format, parseISO, isPast } from "date-fns"; // Added parseISO and isPast

const TasksPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // State to keep track of reminders that have already been alerted in the current session
  const [alertedReminders, setAlertedReminders] = useState(() => {
    // Initialize from sessionStorage if available
    const storedAlerts = sessionStorage.getItem("alertedReminders");
    return storedAlerts ? new Set(JSON.parse(storedAlerts)) : new Set();
  });

  // State for the task form
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    reminder: "",
  });
  const [isEditing, setIsEditing] = useState(false); // To know if we are editing an existing task
  const [currentTaskId, setCurrentTaskId] = useState(null); // ID of the task being edited

  const API_URL = "http://localhost:5000/api/tasks/"; // Base URL for task API

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch tasks when user is available or tasks change
  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        // Only fetch if user is logged in
        setLoadingTasks(true);
        setError("");
        try {
          const res = await axios.get(API_URL);
          setTasks(res.data);
        } catch (err) {
          console.error(
            "Error fetching tasks:",
            err.response?.data?.message || err.message
          );
          setError("Failed to fetch tasks.");
        } finally {
          setLoadingTasks(false);
        }
      }
    };

    fetchTasks();
  }, [user]); // Re-run when user changes (e.g., after login)

  // Reminder Logic Effect
  useEffect(() => {
    const checkReminders = () => {
      if (tasks.length > 0) {
        const now = new Date();
        const newAlertedReminders = new Set(alertedReminders); // Create a mutable copy

        tasks.forEach((task) => {
          if (task.reminder && !task.completed) {
            const reminderDate = parseISO(task.reminder);
            // Check if reminder is in the past and hasn't been alerted yet
            if (isPast(reminderDate) && !newAlertedReminders.has(task._id)) {
              window.alert(
                `Reminder: Your task "${task.title}" is due now!\nDue: ${format(
                  reminderDate,
                  "PPpp"
                )}`
              );
              newAlertedReminders.add(task._id); // Mark this reminder as alerted
            }
          }
        });

        // Update state and sessionStorage only if there were new alerts
        if (newAlertedReminders.size !== alertedReminders.size) {
          setAlertedReminders(newAlertedReminders);
          sessionStorage.setItem(
            "alertedReminders",
            JSON.stringify(Array.from(newAlertedReminders))
          );
        }
      }
    };

    // Set up an interval to check reminders every 10 seconds (adjust as needed)
    const reminderInterval = setInterval(checkReminders, 10 * 1000); // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(reminderInterval);
  }, [tasks, alertedReminders]); // Depend on tasks and alertedReminders

  // Handle form input changes
  const handleFormChange = (e) => {
    setTaskFormData({ ...taskFormData, [e.target.name]: e.target.value });
  };

  // Handle form submission (Create or Update Task)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!taskFormData.title.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      let res;
      if (isEditing && currentTaskId) {
        // Update existing task
        res = await axios.put(`${API_URL}${currentTaskId}`, taskFormData);
        setTasks(
          tasks.map((task) => (task._id === currentTaskId ? res.data : task))
        );
        setSuccessMessage("Task updated successfully!");

        // If editing, and reminder time potentially changed, remove from alertedReminders
        setAlertedReminders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentTaskId); // Remove the old task ID
          // If the updated task has a new reminder that's already past, add it
          if (
            taskFormData.reminder &&
            isPast(parseISO(taskFormData.reminder))
          ) {
            newSet.add(res.data._id); // Add the updated task ID
          }
          sessionStorage.setItem(
            "alertedReminders",
            JSON.stringify(Array.from(newSet))
          );
          return newSet;
        });
      } else {
        // Create new task
        res = await axios.post(API_URL, taskFormData);
        setTasks([res.data, ...tasks]); // Add new task to the top of the list
        setSuccessMessage("Task created successfully!");

        // If a new reminder is set and is already past, mark it as alerted
        if (taskFormData.reminder && isPast(parseISO(taskFormData.reminder))) {
          setAlertedReminders((prev) => {
            const newSet = new Set(prev);
            newSet.add(res.data._id);
            sessionStorage.setItem(
              "alertedReminders",
              JSON.stringify(Array.from(newSet))
            );
            return newSet;
          });
        }
      }

      // Clear form and reset editing state
      setTaskFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "Medium",
        reminder: "",
      });
      setIsEditing(false);
      setCurrentTaskId(null);
    } catch (err) {
      console.error(
        "Error saving task:",
        err.response?.data?.message || err.message
      );
      setError(
        `Failed to save task: ${err.response?.data?.message || "Unknown error"}`
      );
    }
  };

  // Set form data for editing
  const handleEditTask = (task) => {
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "", // Format for input type="date"
      priority: task.priority,
      reminder: task.reminder
        ? format(new Date(task.reminder), "yyyy-MM-dd'T'HH:mm")
        : "", // Format for input type="datetime-local"
    });
    setIsEditing(true);
    setCurrentTaskId(task._id);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top to show form
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setError("");
      setSuccessMessage("");
      try {
        await axios.delete(`${API_URL}${id}`);
        setTasks(tasks.filter((task) => task._id !== id));
        setSuccessMessage("Task deleted successfully!");
        // Also remove from alertedReminders if deleted
        setAlertedReminders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          sessionStorage.setItem(
            "alertedReminders",
            JSON.stringify(Array.from(newSet))
          );
          return newSet;
        });
      } catch (err) {
        console.error(
          "Error deleting task:",
          err.response?.data?.message || err.message
        );
        setError("Failed to delete task.");
      }
    }
  };

  // Toggle Task Completion
  const handleToggleComplete = async (id) => {
    setError("");
    setSuccessMessage("");
    try {
      const res = await axios.put(`${API_URL}${id}/complete`);
      setTasks(tasks.map((task) => (task._id === id ? res.data : task)));
      setSuccessMessage("Task status updated!");
      // If task is marked complete, remove from alertedReminders
      if (res.data.completed) {
        setAlertedReminders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          sessionStorage.setItem(
            "alertedReminders",
            JSON.stringify(Array.from(newSet))
          );
          return newSet;
        });
      }
    } catch (err) {
      console.error(
        "Error toggling task completion:",
        err.response?.data?.message || err.message
      );
      setError("Failed to update task status.");
    }
  };

  // Add a useEffect to clear success/error messages after a few seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or message change
    }
  }, [successMessage, error]);

  if (authLoading || (!user && !authLoading)) {
    return <div className="container">Loading user data...</div>; // Show loading or redirect
  }

  return (
    <div className="container">
      <h2>Your Tasks {user && `(${user.username})`}</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      <div className="add-task-form">
        <h3>{isEditing ? "Edit Task" : "Add New Task"}</h3>
        <form onSubmit={handleTaskSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Task title"
              value={taskFormData.title}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              placeholder="Task description"
              value={taskFormData.description}
              onChange={handleFormChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date (Optional)</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={taskFormData.dueDate}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reminder">Reminder (Optional)</label>
            <input
              type="datetime-local"
              id="reminder"
              name="reminder"
              value={taskFormData.reminder}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={taskFormData.priority}
              onChange={handleFormChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <button type="submit" className="btn btn-block">
            {isEditing ? "Update Task" : "Add Task"}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => {
                setIsEditing(false);
                setCurrentTaskId(null);
                setTaskFormData({
                  title: "",
                  description: "",
                  dueDate: "",
                  priority: "Medium",
                  reminder: "",
                });
              }}
              style={{ marginTop: "10px", backgroundColor: "#6c757d" }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {loadingTasks ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found. Add a new task above!</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
