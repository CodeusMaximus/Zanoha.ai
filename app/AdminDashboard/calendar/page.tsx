"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
  Event,
  View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  subMonths,
  addMonths,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Date-fns localization setup
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// 🔧 Update if your connect route differs
const CONNECT_URL = "/api/google/connect";

// Define event structure
interface CustomEvent extends Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  leadId?: string;
  description?: string;
  type?: string;
  meetLink?: string;
  attendees?: string[];
  status?: string;
  htmlLink?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // ✅ New: handle Google reauth required state
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthMessage, setReauthMessage] = useState<string | null>(null);

  // Helper to get tenant-specific localStorage key
  const getLocalStorageKey = () => {
    if (!businessId) return "calendarEvents"; // Fallback for safety
    return `calendarEvents_${businessId}`;
  };

  const loadLocalEvents = (storageKey: string) => {
    const savedEvents = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return savedEvents.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      type: event.type || "local",
    })) as CustomEvent[];
  };

  // Fetch events from Google Calendar
  const fetchGoogleCalendarEvents = async () => {
    setLoading(true);

    try {
      const timeMin = subMonths(date, 3).toISOString();
      const timeMax = addMonths(date, 3).toISOString();

      const res = await fetch(
        `/api/calendar/get-events?timeMin=${encodeURIComponent(
          timeMin
        )}&timeMax=${encodeURIComponent(timeMax)}`
      );

      // ✅ If backend says reconnect is required, show UI for it
      if (res.status === 401) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }

        const err = body?.error || body?.message || "Unauthorized";
        if (err === "google_reauth_required") {
          setNeedsReauth(true);
          setReauthMessage(
            body?.message ||
              "Your Google Calendar connection expired. Please reconnect."
          );

          // Still show local events (so calendar isn't empty)
          const storageKey = getLocalStorageKey();
          const localEvents = loadLocalEvents(storageKey);
          setEvents(localEvents);

          return;
        }

        toast.error("Unauthorized");
        return;
      }

      const data = await res.json();

      if (data.success) {
        // ✅ Clear reauth banner on success
        setNeedsReauth(false);
        setReauthMessage(null);

        // Set businessId from API response (works even if no events exist yet)
        if (data.businessId && !businessId) {
          setBusinessId(data.businessId);
        }

        const googleEvents: CustomEvent[] = (data.events || []).map(
          (event: any) => ({
            id: event.id,
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            description: event.description,
            meetLink: event.meetLink,
            attendees: event.attendees,
            status: event.status,
            htmlLink: event.htmlLink,
            type: "google-calendar",
          })
        );

        // Use tenant-specific localStorage key
        const storageKey = data.businessId
          ? `calendarEvents_${data.businessId}`
          : "calendarEvents";

        const localEvents = loadLocalEvents(storageKey);

        setEvents([...googleEvents, ...localEvents]);
      } else {
        // If backend returns a known error string, surface it
        if (data?.error === "google_reauth_required") {
          setNeedsReauth(true);
          setReauthMessage(
            data?.message ||
              "Your Google Calendar connection expired. Please reconnect."
          );
          const localEvents = loadLocalEvents(getLocalStorageKey());
          setEvents(localEvents);
          return;
        }

        toast.error(data?.error || "Failed to fetch calendar events");
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      toast.error("Error loading calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleCalendarEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGoogleCalendarEvents();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedDate(slotInfo.start);
    setShowModal(true);
  };

  const handleSelectEvent = (event: CustomEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleAddAppointment = () => {
    if (!appointmentTitle || !selectedDate || !appointmentTime) return;

    const appointmentStart = new Date(selectedDate);
    const [hours, minutes] = appointmentTime.split(":").map(Number);
    appointmentStart.setHours(hours, minutes);

    const newEvent: CustomEvent = {
      title: appointmentTitle,
      start: appointmentStart,
      end: new Date(appointmentStart.getTime() + 60 * 60 * 1000),
      type: "local",
    };

    // Use tenant-specific localStorage key
    const storageKey = getLocalStorageKey();
    const savedEvents = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedLocalEvents = [...savedEvents, newEvent];
    localStorage.setItem(storageKey, JSON.stringify(updatedLocalEvents));

    setEvents([...events, newEvent]);

    setShowModal(false);
    setAppointmentTitle("");
    setAppointmentTime("");

    toast.success("Appointment added successfully!");

    const timeUntilAppointment =
      newEvent.start.getTime() - new Date().getTime();
    if (
      timeUntilAppointment > 0 &&
      timeUntilAppointment < 24 * 60 * 60 * 1000
    ) {
      setTimeout(() => {
        toast.info(`⏰ Reminder: "${newEvent.title}" is coming up!`, {
          position: "top-right",
          autoClose: 5000,
        });
      }, Math.max(0, timeUntilAppointment - 10 * 60 * 1000));
    }
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    if (selectedEvent.type === "google-calendar") {
      toast.warning(
        "Cannot delete Google Calendar events from here. Please use Google Calendar."
      );
      return;
    }

    // Use tenant-specific localStorage key
    const storageKey = getLocalStorageKey();
    const savedEvents = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedEvents = savedEvents.filter(
      (e: any) =>
        new Date(e.start).getTime() !== selectedEvent.start.getTime() ||
        e.title !== selectedEvent.title
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedEvents));

    setEvents(events.filter((e) => e !== selectedEvent));
    setShowEventModal(false);
    setSelectedEvent(null);

    toast.success("Event deleted successfully!");
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const eventStyleGetter = (event: CustomEvent) => {
    if (event.type === "google-calendar") {
      return {
        style: {
          backgroundColor: "#4285F4",
          borderRadius: "5px",
          color: "white",
          border: "none",
          fontWeight: "500",
        },
      };
    }
    if (event.type === "lead-followup") {
      return {
        style: {
          backgroundColor: "#8B5CF6",
          borderRadius: "5px",
          color: "white",
          border: "none",
        },
      };
    }
    return {
      style: {
        backgroundColor: "#10B981",
        borderRadius: "5px",
        color: "white",
        border: "none",
      },
    };
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Calendar
          </h1>

          {loading && (
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400 dark:border-white/60" />
          )}

          {/* ✅ Status pill */}
          {needsReauth ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-200">
              Google disconnected
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200">
              Google connected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchGoogleCalendarEvents}
            disabled={loading}
            className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 disabled:opacity-50
                       dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
          >
            🔄 Refresh
          </button>

          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-blue-500" />
              Google Calendar
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
              Local
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Reauth banner */}
      {needsReauth && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 ring-1 ring-amber-500/15 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Google Calendar needs reconnect
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                {reauthMessage ||
                  "Your Google Calendar connection expired or was revoked. Reconnect to see Google events again."}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={CONNECT_URL}
                className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Reconnect Google
              </a>

              <button
                onClick={() => {
                  setNeedsReauth(false);
                  setReauthMessage(null);
                }}
                className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                           dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl border border-black/10 bg-white p-4 ring-1 ring-black/5
                    dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
      >
        <div
          className="h-[78vh] overflow-hidden rounded-xl bg-zinc-50 p-2
                      dark:bg-black/30"
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            view={view}
            onView={setView}
            date={date}
            onNavigate={handleNavigate}
            views={["month", "week", "day"]}
            className="rbc-dark dark:rbc-dark"
          />
        </div>
      </div>

      <ToastContainer theme="colored" position="bottom-right" />

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 ring-1 ring-black/5
                        dark:border-white/10 dark:bg-[#0f1420] dark:ring-white/10"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              Add Local Event
            </h2>

            <input
              type="text"
              placeholder="Enter event title"
              value={appointmentTitle}
              onChange={(e) => setAppointmentTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-1 ring-transparent focus:ring-black/10
                       dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:ring-white/20"
            />

            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full mt-3 rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-1 ring-transparent focus:ring-black/10
                       dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:ring-white/20"
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                         dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAppointment}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800
                         dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 ring-1 ring-black/5
                        dark:border-white/10 dark:bg-[#0f1420] dark:ring-white/10"
          >
            <div className="flex justify-between items-start mb-4 gap-3">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {selectedEvent.title}
              </h2>
              {selectedEvent.type === "google-calendar" && (
                <span
                  className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 text-xs ring-1 ring-blue-500/20
                               dark:bg-blue-500/15 dark:text-blue-200"
                >
                  📅 Google
                </span>
              )}
            </div>

            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              📅 {format(selectedEvent.start, "MMMM d, yyyy h:mm a")} -{" "}
              {format(selectedEvent.end, "h:mm a")}
            </p>

            {selectedEvent.meetLink && (
              <div className="mb-4">
                <a
                  href={selectedEvent.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15
                           dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                >
                  🎥 Join Google Meet
                </a>
              </div>
            )}

            {selectedEvent.attendees?.length ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Attendees
                </h3>
                <div
                  className="rounded-xl border border-black/10 bg-zinc-50 p-3
                              dark:border-white/10 dark:bg-black/30"
                >
                  {selectedEvent.attendees.map((email, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      📧 {email}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedEvent.description ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Notes
                </h3>
                <div
                  className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-700
                              dark:border-white/10 dark:bg-black/30 dark:text-zinc-300"
                >
                  {selectedEvent.description}
                </div>
              </div>
            ) : null}

            {selectedEvent.htmlLink && (
              <div className="mb-4">
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline dark:text-blue-200"
                >
                  View in Google Calendar →
                </a>
              </div>
            )}

            <div className="flex justify-between mt-4">
              {selectedEvent.type !== "google-calendar" && (
                <button
                  onClick={handleDeleteEvent}
                  className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-500/20 hover:bg-red-500/15
                           dark:bg-red-500/20 dark:text-red-100 dark:hover:bg-red-500/25"
                >
                  Delete
                </button>
              )}

              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="ml-auto rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                         dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
