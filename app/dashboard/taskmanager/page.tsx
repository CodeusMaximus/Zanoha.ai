"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Trash2, ChevronLeft, ChevronRight, ArrowRight, RefreshCw } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";

// Task type
interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  date: Date;
  meetLink?: string;
  calendarEventId?: string;
  attendeeEmail?: string;
}

function TaskCard({
  task,
  moveTask,
  deleteTask,
  pushToNextDay,
}: {
  task: Task;
  moveTask: (id: string, newStatus: Task["status"]) => void;
  deleteTask: (id: string) => void;
  pushToNextDay: (id: string) => void;
}) {
  const [sendingReminder, setSendingReminder] = useState(false);
  
  const isDone = task.status === "done";
  const isInProgress = task.status === "in-progress";
  const isCalendarBooking = !!task.meetLink;

  const sendReminder = async () => {
    if (!confirm(`Send reminder email to ${task.attendeeEmail}?`)) {
      return;
    }

    setSendingReminder(true);
    try {
      const res = await fetch(`/api/task/${task.id}/remind`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Reminder sent to ${task.attendeeEmail}!\n\nMeeting in ${data.hoursUntilMeeting} hours.`);
      } else {
        const error = await res.json();
        alert(`❌ Failed to send reminder: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("❌ Failed to send reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className={`group relative rounded-xl border bg-white p-4 ring-1 transition-all hover:shadow-lg dark:bg-white/5 ${
      isDone 
        ? "border-emerald-500/25 ring-emerald-500/15 opacity-70 dark:border-emerald-500/20" 
        : isInProgress 
        ? "border-amber-500/25 ring-amber-500/15 dark:border-amber-500/20" 
        : "border-blue-500/25 ring-blue-500/15 dark:border-blue-500/20"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base mb-2 ${
            isDone 
              ? "line-through text-zinc-400 dark:text-zinc-600" 
              : "text-zinc-900 dark:text-white"
          }`}>
            {task.title}
          </h3>
          
          {task.attendeeEmail && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 truncate font-medium">
              📧 {task.attendeeEmail}
            </p>
          )}
          
          {task.meetLink && (
            <a
              href={task.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3 font-medium"
            >
              🎥 Join Meeting →
            </a>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {!isDone && !isInProgress && (
              <button
                onClick={() => moveTask(task.id, "in-progress")}
                className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
              >
                ▶ Start
              </button>
            )}
            {!isDone && (
              <button
                onClick={() => moveTask(task.id, "done")}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                ✓ Done
              </button>
            )}
            {isInProgress && (
              <button
                onClick={() => pushToNextDay(task.id)}
                className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors flex items-center gap-1"
              >
                Tomorrow <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {isCalendarBooking && task.attendeeEmail && !isDone && (
              <button
                onClick={sendReminder}
                disabled={sendingReminder}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sendingReminder ? "Sending..." : "⏰ Remind"}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 rounded-xl bg-red-500/10 p-2 text-red-600 ring-1 ring-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/25 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const fetchTasks = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      
      const res = await fetch("/api/task");
      if (!res.ok) {
        console.error("Failed to fetch tasks:", res.status);
        return;
      }
      const data = await res.json();
      
      const tasksFromApi: Task[] = (data.tasks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        date: new Date(t.date),
        meetLink: t.meetLink,
        calendarEventId: t.calendarEventId,
        attendeeEmail: t.attendeeEmail,
      }));
      
      setTasks(tasksFromApi);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchTasks(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => fetchTasks(false);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          status: "todo",
          date: selectedDate.toISOString(),
        }),
      });

      if (!res.ok) {
        console.error("Failed to create task:", res.status);
        return;
      }

      const data = await res.json();
      const created = data.task;

      setTasks((prev) => [...prev, {
        id: created.id,
        title: created.title,
        status: created.status,
        date: new Date(created.date),
      }]);
      setNewTaskTitle("");
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (id: string, newStatus: Task["status"]) => {
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((task) => task.id === id ? { ...task, status: newStatus } : task)
    );

    try {
      const res = await fetch(`/api/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error("Failed to update task status:", res.status);
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
      setTasks(previousTasks);
    }
  };

  const pushToNextDay = async (id: string) => {
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextDay = addDays(task.date, 1);
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, date: nextDay } : t)
    );

    try {
      const res = await fetch(`/api/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: nextDay.toISOString() }),
      });
      if (!res.ok) {
        console.error("Failed to push task to next day:", res.status);
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error("Failed to push task to next day:", err);
      setTasks(previousTasks);
    }
  };

  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      const res = await fetch(`/api/task/${id}`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Failed to delete task:", res.status);
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setTasks(previousTasks);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Weekly Tasks
          </h1>
          
          {loading && (
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400 dark:border-white/60" />
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </div>
        </button>
      </div>

      {/* Add Task Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 ring-1 ring-black/5 dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What needs to be done today?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none ring-1 ring-transparent focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder-zinc-400 dark:focus:ring-white/20"
          />
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none ring-1 ring-transparent focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:ring-white/20"
          />
          <button
            onClick={addTask}
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              {saving ? "Adding..." : "Add Task"}
            </div>
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            Previous
          </div>
        </button>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">
            {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
          </div>
          <button
            onClick={goToToday}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 font-semibold"
          >
            Jump to Today →
          </button>
        </div>

        <button
          onClick={goToNextWeek}
          className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
        >
          <div className="flex items-center gap-2">
            Next
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayString = day.toDateString();
            const dayTasks = tasks.filter((task) => task.date.toDateString() === dayString);
            const isToday = dayString === new Date().toDateString();
            
            const todoCount = dayTasks.filter(t => t.status === "todo").length;
            const inProgressCount = dayTasks.filter(t => t.status === "in-progress").length;
            const doneCount = dayTasks.filter(t => t.status === "done").length;

            return (
              <div
                key={dayString}
                className={`rounded-2xl border bg-white p-4 ring-1 min-h-[500px] flex flex-col ${
                  isToday 
                    ? "border-blue-500/50 ring-blue-500/25 dark:border-blue-500/50 dark:ring-blue-500/25" 
                    : "border-black/10 ring-black/5 dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
                }`}
              >
                {/* Header */}
                <div className="mb-4 pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-bold text-base ${isToday ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"}`}>
                      {format(day, "EEEE")}
                    </div>
                    {isToday && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-zinc-700 dark:text-zinc-300">
                    {format(day, "d")}
                  </div>
                  
                  {dayTasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold">
                      {todoCount > 0 && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-1 text-blue-700 ring-1 ring-blue-500/25 dark:text-blue-300">
                          {todoCount} todo
                        </span>
                      )}
                      {inProgressCount > 0 && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
                          {inProgressCount} active
                        </span>
                      )}
                      {doneCount > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                          {doneCount} done
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="text-center text-zinc-500 dark:text-zinc-500 py-12 text-sm font-medium">
                      No tasks scheduled
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        moveTask={moveTask}
                        deleteTask={deleteTask}
                        pushToNextDay={pushToNextDay}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}