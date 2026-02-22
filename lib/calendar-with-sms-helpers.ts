/**
 * lib/calendar-with-sms-helpers.ts
 * 
 * Create events in Google Calendar + send SMS notifications
 * (Simpler version without Outlook)
 */

import { getOrCreateCalendarForBusiness, getCalendarClient } from "./calendar-helpers";
import {
  sendEventConfirmationSMS,
  sendEventUpdateSMS,
  sendEventCancellationSMS,
  scheduleEventReminders,
  formatPhoneNumber,
  isValidPhoneNumber,
} from "./sms-calendar-helpers";

/**
 * Create event in Google Calendar AND send SMS confirmation + schedule reminders
 */
export async function createEventWithSMS(params: {
  businessId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  createMeeting?: boolean;
  businessName?: string;
  // SMS specific
  recipientPhone?: string; // Phone number to send SMS to
  sendSMS?: boolean; // Whether to send SMS at all
  smsReminders?: number[]; // Minutes before event to send reminders (e.g., [60, 15])
}): Promise<{
  eventId: string;
  calendarId: string;
  meetLink?: string;
  smsSent: boolean;
  smsMessageSid?: string;
  reminderCount?: number;
}> {
  const {
    businessId,
    title,
    description,
    startTime,
    endTime,
    attendees = [],
    createMeeting = false,
    businessName,
    recipientPhone,
    sendSMS = false,
    smsReminders = [60, 15], // Default: 1 hour and 15 minutes before
  } = params;

  // Get calendar for this tenant
  const calendarId = await getOrCreateCalendarForBusiness(businessId, businessName);
  const calendar = getCalendarClient();

  // Create event in Google Calendar
  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: createMeeting ? 1 : 0,
    requestBody: {
      summary: title,
      description: description || "",
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/New_York",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/New_York",
      },
      attendees: attendees.map((email) => ({ email })),
      conferenceData: createMeeting
        ? {
            createRequest: {
              requestId: `${businessId}-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    },
  });

  const eventId = event.data.id!;
  const meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri;

  console.log(`✅ Created Google Calendar event: ${eventId}`);

  let smsSent = false;
  let smsMessageSid: string | undefined;
  let reminderCount = 0;

  // Send SMS if enabled and phone provided
  if (sendSMS && recipientPhone) {
    const phoneNumber = formatPhoneNumber(recipientPhone);

    if (isValidPhoneNumber(phoneNumber)) {
      // Send immediate confirmation
      const confirmResult = await sendEventConfirmationSMS({
        to: phoneNumber,
        eventTitle: title,
        startTime,
        endTime,
        location: description,
        meetingLink: meetLink || undefined,
      });

      smsSent = confirmResult.success;
      smsMessageSid = confirmResult.messageSid;

      // Schedule reminders (these will be sent closer to event time)
      const timeouts = scheduleEventReminders({
        to: phoneNumber,
        eventTitle: title,
        startTime,
        endTime,
        location: description,
        meetingLink: meetLink || undefined,
        reminders: smsReminders,
      });

      reminderCount = timeouts.length;

      console.log(
        `✅ SMS confirmation sent to ${phoneNumber}, ${reminderCount} reminders scheduled`
      );
    } else {
      console.warn(`⚠️ Invalid phone number format: ${recipientPhone}`);
    }
  }

  return {
    eventId,
    calendarId,
    meetLink: meetLink || undefined,
    smsSent,
    smsMessageSid,
    reminderCount,
  };
}

/**
 * Update event in Google Calendar AND send SMS update notification
 */
export async function updateEventWithSMS(params: {
  businessId: string;
  eventId: string;
  updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendees?: string[];
  };
  // SMS specific
  recipientPhone?: string;
  sendSMS?: boolean;
}): Promise<{ smsSent: boolean }> {
  const { businessId, eventId, updates, recipientPhone, sendSMS = false } = params;

  // Get calendar for this tenant
  const calendarId = await getOrCreateCalendarForBusiness(businessId);
  const calendar = getCalendarClient();

  // Build update object
  const googleUpdates: any = {};
  if (updates.title) googleUpdates.summary = updates.title;
  if (updates.description) googleUpdates.description = updates.description;
  if (updates.startTime) {
    googleUpdates.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: "America/New_York",
    };
  }
  if (updates.endTime) {
    googleUpdates.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: "America/New_York",
    };
  }
  if (updates.attendees) {
    googleUpdates.attendees = updates.attendees.map((email) => ({ email }));
  }

  // Update in Google Calendar
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: googleUpdates,
  });

  console.log(`✅ Updated Google Calendar event: ${eventId}`);

  let smsSent = false;

  // Send SMS notification if enabled
  if (sendSMS && recipientPhone && updates.startTime) {
    const phoneNumber = formatPhoneNumber(recipientPhone);

    if (isValidPhoneNumber(phoneNumber)) {
      const result = await sendEventUpdateSMS({
        to: phoneNumber,
        eventTitle: updates.title || "Event",
        startTime: updates.startTime,
        endTime: updates.endTime,
        location: updates.description,
      });

      smsSent = result.success;
    }
  }

  return { smsSent };
}

/**
 * Delete event from Google Calendar AND send SMS cancellation
 */
export async function deleteEventWithSMS(params: {
  businessId: string;
  eventId: string;
  // For SMS notification
  eventTitle?: string;
  startTime?: Date;
  recipientPhone?: string;
  sendSMS?: boolean;
}): Promise<{ smsSent: boolean }> {
  const { businessId, eventId, eventTitle, startTime, recipientPhone, sendSMS = false } = params;

  // Get calendar for this tenant
  const calendarId = await getOrCreateCalendarForBusiness(businessId);
  const calendar = getCalendarClient();

  // Delete from Google Calendar
  await calendar.events.delete({
    calendarId,
    eventId,
  });

  console.log(`✅ Deleted Google Calendar event: ${eventId}`);

  let smsSent = false;

  // Send cancellation SMS if enabled
  if (sendSMS && recipientPhone && eventTitle && startTime) {
    const phoneNumber = formatPhoneNumber(recipientPhone);

    if (isValidPhoneNumber(phoneNumber)) {
      const result = await sendEventCancellationSMS({
        to: phoneNumber,
        eventTitle,
        startTime,
      });

      smsSent = result.success;
    }
  }

  return { smsSent };
}