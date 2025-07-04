// src/pages/TasksPage.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import TaskItem from "../components/TaskItem";
import { format, parseISO, isPast } from "date-fns";

const TasksPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [alertedReminders, setAlertedReminders] = useState(() => {
    const storedAlerts = sessionStorage.getItem("alertedReminders");
    return storedAlerts ? new Set(JSON.parse(storedAlerts)) : new Set();
  });

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    reminder: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  const API_URL = "http://localhost:5000/api/tasks/";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        setLoadingTasks(true);
        setError("");
        try {
          const res = await axios.get(API_URL);
          setTasks(res.data);
        } catch (err) {
          console.error("Error fetching tasks:", err.message);
          setError("Failed to fetch tasks.");
        } finally {
          setLoadingTasks(false);
        }
      }
    };

    fetchTasks();
  }, [user]);

  useEffect(() => {
    const checkReminders = () => {
      const newAlerts = new Set(alertedReminders);

      tasks.forEach((task) => {
        if (task.reminder && !task.completed) {
          const reminderTime = parseISO(task.reminder);
          if (isPast(reminderTime) && !newAlerts.has(task._id)) {
            window.alert(
              `Reminder: ${task.title} is due!\nDue: ${format(
                reminderTime,
                "PPpp"
              )}`
            );
            newAlerts.add(task._id);
          }
        }
      });

      if (newAlerts.size !== alertedReminders.size) {
        setAlertedReminders(newAlerts);
        sessionStorage.setItem(
          "alertedReminders",
          JSON.stringify(Array.from(newAlerts))
        );
      }
    };

    const interval = setInterval(checkReminders, 10 * 1000);
    return () => clearInterval(interval);
  }, [tasks, alertedReminders]);

  const handleFormChange = (e) => {
    setTaskFormData({ ...taskFormData, [e.target.name]: e.target.value });
  };

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
        res = await axios.put(`${API_URL}${currentTaskId}`, taskFormData);
        setTasks(
          tasks.map((task) => (task._id === currentTaskId ? res.data : task))
        );
        setSuccessMessage("Task updated successfully!");
        setAlertedReminders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(currentTaskId);
          if (
            taskFormData.reminder &&
            isPast(parseISO(taskFormData.reminder))
          ) {
            newSet.add(res.data._id);
          }
          sessionStorage.setItem(
            "alertedReminders",
            JSON.stringify(Array.from(newSet))
          );
          return newSet;
        });
      } else {
        res = await axios.post(API_URL, taskFormData);
        setTasks([res.data, ...tasks]);
        setSuccessMessage("Task created successfully!");
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
      console.error("Error saving task:", err.message);
      setError("Failed to save task.");
    }
  };

  const handleEditTask = (task) => {
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate
        ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      priority: task.priority,
      reminder: task.reminder
        ? format(new Date(task.reminder), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
    setIsEditing(true);
    setCurrentTaskId(task._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setError("");
      setSuccessMessage("");
      try {
        await axios.delete(`${API_URL}${id}`);
        setTasks(tasks.filter((task) => task._id !== id));
        setSuccessMessage("Task deleted successfully!");
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
        console.error("Error deleting task:", err.message);
        setError("Failed to delete task.");
      }
    }
  };

  const handleToggleComplete = async (id) => {
    setError("");
    setSuccessMessage("");
    try {
      const res = await axios.put(`${API_URL}${id}/complete`);
      setTasks(tasks.map((task) => (task._id === id ? res.data : task)));
      setSuccessMessage("Task status updated!");
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
      console.error("Error toggling task completion:", err.message);
      setError("Failed to update task status.");
    }
  };

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (authLoading || (!user && !authLoading)) {
    return <div className="container">Loading user data...</div>;
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
              value={taskFormData.title}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={taskFormData.description}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="datetime-local"
              id="dueDate"
              name="dueDate"
              value={taskFormData.dueDate}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reminder">Reminder</label>
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
        </form>
      </div>

      {loadingTasks ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found.</p>
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
