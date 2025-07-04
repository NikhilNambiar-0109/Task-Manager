const cron = require("node-cron");
const moment = require("moment-timezone");
const Task = require("./models/Task");
const User = require("./models/User");
const sendReminderEmail = require("./utils/sendEmail");

console.log("🔁 Reminder scheduler is running every minute...");

// ⏰ Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  console.log("🕐 Scheduler tick at:", now.toLocaleTimeString());

  try {
    const tasks = await Task.find({
      reminder: { $gte: oneMinuteAgo, $lte: now },
      completed: false,
      reminderSent: false,
    });

    console.log(`🔍 Found ${tasks.length} task(s) needing reminders.`);

    if (tasks.length === 0) {
      console.log("📭 No tasks to remind.");
    }

    for (const task of tasks) {
      console.log("📆 task.title:", task.title);
      console.log("📆 task.reminder:", task.reminder);
      console.log("📆 task.dueDate (raw):", task.dueDate);
      console.log("📆 typeof dueDate:", typeof task.dueDate);

      const user = await User.findById(task.userId);
      if (!user?.email) {
        console.log(
          `⚠️ Skipping task "${task.title}" - user or email missing.`
        );
        continue;
      }

      let dueAt = "N/A";
      if (task.dueDate && moment(task.dueDate).isValid()) {
        try {
          dueAt = moment(task.dueDate)
            .tz("Asia/Kolkata")
            .format("DD MMM YYYY, h:mm A"); // Ex: 05 Jul 2025, 4:20 PM
        } catch (err) {
          console.error("❌ Error formatting dueDate:", err.message);
        }
      }

      const message = `Hi ${user.username},\n\nReminder: Your task "${task.title}" is due soon.\n\nDescription: ${task.description}\nDue at: ${dueAt}\n\n– Task Manager`;

      try {
        console.log(`📨 Sending reminder for "${task.title}" to ${user.email}`);
        await sendReminderEmail(user.email, "⏰ Task Reminder", message);
        console.log(`✅ Reminder sent for "${task.title}"`);

        await Task.findByIdAndUpdate(task._id, { reminderSent: true });
      } catch (emailErr) {
        console.error(`❌ Email failed for ${user.email}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Error in reminder scheduler:", err.message);
  }
});
