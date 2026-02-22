 /**
 * lib/sms-calendar-helpers.ts
 * 
 * Send calendar event reminders via SMS using Twilio
 */

import twilio from "twilio";

/**
 * Get Twilio client
 */
function getTwilioClient() {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Missing Twilio credentials in environment variables");
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Format date for SMS message
 */
function formatDateForSMS(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
}

/**
 * Send SMS reminder for a calendar event
 */
export async function sendCalendarSMS(params: {
  to: string; // Phone number in E.164 format: +1234567890
  eventTitle: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  meetingLink?: string;
  reminderType?: 'confirmation' | 'reminder' | 'update' | 'cancellation';
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const {
    to,
    eventTitle,
    startTime,
    endTime,
    location,
    meetingLink,
    reminderType = 'confirmation',
  } = params;

  try {
    const client = getTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER!;

    // Build message based on type
    let message = '';
    
    switch (reminderType) {
      case 'confirmation':
        message = `✅ Calendar Event Confirmed\n\n`;
        message += `📅 ${eventTitle}\n`;
        message += `🕐 ${formatDateForSMS(startTime)}`;
        if (endTime) {
          message += ` - ${formatDateForSMS(endTime)}`;
        }
        if (location) {
          message += `\n📍 ${location}`;
        }
        if (meetingLink) {
          message += `\n🔗 ${meetingLink}`;
        }
        break;

      case 'reminder':
        message = `⏰ Reminder: Upcoming Event\n\n`;
        message += `📅 ${eventTitle}\n`;
        message += `🕐 ${formatDateForSMS(startTime)}`;
        if (location) {
          message += `\n📍 ${location}`;
        }
        if (meetingLink) {
          message += `\n🔗 Join: ${meetingLink}`;
        }
        break;

      case 'update':
        message = `📝 Event Updated\n\n`;
        message += `📅 ${eventTitle}\n`;
        message += `🕐 New time: ${formatDateForSMS(startTime)}`;
        if (location) {
          message += `\n📍 ${location}`;
        }
        if (meetingLink) {
          message += `\n🔗 ${meetingLink}`;
        }
        break;

      case 'cancellation':
        message = `❌ Event Cancelled\n\n`;
        message += `📅 ${eventTitle}\n`;
        message += `🕐 Was scheduled for: ${formatDateForSMS(startTime)}`;
        break;
    }

    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    console.log(`✅ SMS sent to ${to}: ${result.sid}`);

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error: any) {
    console.error(`❌ Failed to send SMS to ${to}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Schedule SMS reminder(s) for an event
 * Returns timeouts/scheduled jobs that you can cancel if needed
 */
export function scheduleEventReminders(params: {
  to: string;
  eventTitle: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  meetingLink?: string;
  reminders?: number[]; // Minutes before event to send reminder (e.g., [60, 15])
}): NodeJS.Timeout[] {
  const {
    to,
    eventTitle,
    startTime,
    endTime,
    location,
    meetingLink,
    reminders = [60, 15], // Default: 1 hour and 15 minutes before
  } = params;

  const timeouts: NodeJS.Timeout[] = [];

  for (const minutesBefore of reminders) {
    const reminderTime = new Date(startTime.getTime() - minutesBefore * 60 * 1000);
    const msUntilReminder = reminderTime.getTime() - Date.now();

    if (msUntilReminder > 0) {
      const timeout = setTimeout(async () => {
        await sendCalendarSMS({
          to,
          eventTitle,
          startTime,
          endTime,
          location,
          meetingLink,
          reminderType: 'reminder',
        });
      }, msUntilReminder);

      timeouts.push(timeout);
      console.log(`📅 Scheduled SMS reminder for ${to} at ${reminderTime.toISOString()}`);
    }
  }

  return timeouts;
}

/**
 * Send immediate confirmation SMS when event is created
 */
export async function sendEventConfirmationSMS(params: {
  to: string;
  eventTitle: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  meetingLink?: string;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  return sendCalendarSMS({
    ...params,
    reminderType: 'confirmation',
  });
}

/**
 * Send update notification when event is modified
 */
export async function sendEventUpdateSMS(params: {
  to: string;
  eventTitle: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  meetingLink?: string;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  return sendCalendarSMS({
    ...params,
    reminderType: 'update',
  });
}

/**
 * Send cancellation notification
 */
export async function sendEventCancellationSMS(params: {
  to: string;
  eventTitle: string;
  startTime: Date;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  return sendCalendarSMS({
    ...params,
    reminderType: 'cancellation',
  });
}

/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Format phone number to E.164 if possible
 * Assumes US number if no country code
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If it's 10 digits, assume US and add +1
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // Add + prefix
  return '+' + cleaned;
}