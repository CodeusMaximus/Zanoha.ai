"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type AutomationType = 
  | "booking_reminders" 
  | "follow_ups" 
  | "missed_call_sms"
  | "appointment_confirmations"
  | "payment_reminders"
  | "review_requests"
  | "birthday_greetings"
  | "re_engagement"
  | "no_show_follow_up"
  | "waitlist_notifications";

interface Automation {
  id: AutomationType;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: "scheduling" | "engagement" | "revenue" | "retention";
  settings?: {
    timing?: number;
    template?: string;
    conditions?: any;
  };
}

export default function AutomationsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "booking_reminders",
      title: "Booking Reminders",
      description: "Automatically remind customers about upcoming appointments via SMS/call",
      icon: "📅",
      enabled: true,
      category: "scheduling",
      settings: {
        timing: 24, // hours before
        template: "Hi {name}! This is a reminder about your appointment tomorrow at {time}. Reply YES to confirm or CANCEL to reschedule.",
      },
    },
    {
      id: "appointment_confirmations",
      title: "Appointment Confirmations",
      description: "Send instant confirmation when bookings are made",
      icon: "✅",
      enabled: true,
      category: "scheduling",
      settings: {
        timing: 0,
        template: "Thanks {name}! Your appointment is confirmed for {date} at {time}. See you then!",
      },
    },
    {
      id: "missed_call_sms",
      title: "Missed Call Follow-Up",
      description: "Automatically text customers when you miss their call",
      icon: "📱",
      enabled: false,
      category: "engagement",
      settings: {
        timing: 5, // minutes after
        template: "Hi! We just missed your call. I'm your AI assistant - how can I help you today? You can also book online at {booking_link}",
      },
    },
    {
      id: "follow_ups",
      title: "Post-Appointment Follow-Up",
      description: "Check in with customers after their appointment",
      icon: "💬",
      enabled: false,
      category: "engagement",
      settings: {
        timing: 24,
        template: "Hi {name}! How was your appointment with us? We'd love to hear your feedback!",
      },
    },
    {
      id: "payment_reminders",
      title: "Payment Reminders",
      description: "Send reminders for outstanding invoices or payments",
      icon: "💰",
      enabled: false,
      category: "revenue",
      settings: {
        timing: 72,
        template: "Hi {name}, this is a friendly reminder about your outstanding balance of ${amount}. Pay securely here: {payment_link}",
      },
    },
    {
      id: "review_requests",
      title: "Review Requests",
      description: "Ask happy customers to leave reviews automatically",
      icon: "⭐",
      enabled: false,
      category: "retention",
      settings: {
        timing: 48,
        template: "Hi {name}! We hope you loved your recent visit. Would you mind leaving us a quick review? {review_link}",
      },
    },
    {
      id: "birthday_greetings",
      title: "Birthday Greetings",
      description: "Send personalized birthday messages with special offers",
      icon: "🎂",
      enabled: false,
      category: "retention",
      settings: {
        timing: 0,
        template: "Happy Birthday {name}! 🎉 Enjoy 20% off your next appointment as our gift to you. Book now: {booking_link}",
      },
    },
    {
      id: "re_engagement",
      title: "Re-engagement Campaign",
      description: "Win back customers who haven't visited in a while",
      icon: "🔄",
      enabled: false,
      category: "retention",
      settings: {
        timing: 2160, // 90 days
        template: "Hi {name}! We miss you! It's been a while since your last visit. Book now and get 15% off: {booking_link}",
      },
    },
    {
      id: "no_show_follow_up",
      title: "No-Show Follow-Up",
      description: "Reach out to customers who missed their appointment",
      icon: "⚠️",
      enabled: false,
      category: "scheduling",
      settings: {
        timing: 1,
        template: "Hi {name}, we noticed you missed your appointment today. Is everything okay? Let's reschedule: {booking_link}",
      },
    },
    {
      id: "waitlist_notifications",
      title: "Waitlist Notifications",
      description: "Alert customers when a spot opens up",
      icon: "🔔",
      enabled: false,
      category: "scheduling",
      settings: {
        timing: 0,
        template: "Good news {name}! A spot just opened up for {date} at {time}. Book now before it's gone: {booking_link}",
      },
    },
  ]);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  const toggleAutomation = (id: AutomationType) => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      )
    );
  };

  const updateAutomationSettings = (id: AutomationType, settings: any) => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === id ? { ...auto, settings: { ...auto.settings, ...settings } } : auto
      )
    );
  };

  const categories = {
    scheduling: { title: "Scheduling & Appointments", color: "blue" },
    engagement: { title: "Customer Engagement", color: "purple" },
    revenue: { title: "Revenue & Payments", color: "green" },
    retention: { title: "Customer Retention", color: "orange" },
  };

  const stats = {
    totalAutomations: automations.length,
    activeAutomations: automations.filter(a => a.enabled).length,
    messagesSent: 1247,
    automationRate: 94.2,
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-200`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Automations</h1>
          <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Set up smart automations to engage customers and streamline your workflow
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Total Automations</p>
            <p className="text-3xl font-bold">{stats.totalAutomations}</p>
          </div>
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Active</p>
            <p className="text-3xl font-bold text-emerald-500">{stats.activeAutomations}</p>
          </div>
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Messages Sent</p>
            <p className="text-3xl font-bold">{stats.messagesSent}</p>
          </div>
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Success Rate</p>
            <p className="text-3xl font-bold">{stats.automationRate}%</p>
          </div>
        </div>

        {/* Automation Categories */}
        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryAutomations = automations.filter(a => a.category === categoryKey);
          
          return (
            <div key={categoryKey} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryAutomations.map((automation, index) => (
                  <motion.div
                    key={automation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 rounded-xl border ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{automation.icon}</span>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{automation.title}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {automation.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleAutomation(automation.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          automation.enabled ? 'bg-emerald-500' : isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            automation.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {automation.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-4 border-t"
                        style={{ borderColor: isDarkMode ? '#262626' : '#e5e5e5' }}
                      >
                        {/* Timing Setting */}
                        {automation.settings?.timing !== undefined && automation.settings.timing > 0 && (
                          <div>
                            <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              {automation.id.includes('reminder') || automation.id.includes('follow') ? 'Send' : 'Trigger'} Time
                            </label>
                            <select
                              value={automation.settings.timing}
                              onChange={(e) => updateAutomationSettings(automation.id, { timing: parseInt(e.target.value) })}
                              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                isDarkMode
                                  ? 'bg-neutral-800 border-neutral-700'
                                  : 'bg-white border-neutral-300'
                              }`}
                            >
                              <option value={5}>5 minutes {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={30}>30 minutes {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={60}>1 hour {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={120}>2 hours {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={360}>6 hours {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={720}>12 hours {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={1440}>1 day {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={2880}>2 days {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={4320}>3 days {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={10080}>1 week {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={43200}>30 days {automation.id.includes('after') ? 'after' : 'before'}</option>
                              <option value={129600}>90 days {automation.id.includes('after') ? 'after' : 'before'}</option>
                            </select>
                          </div>
                        )}

                        {/* Message Template */}
                        <div>
                          <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Message Template
                          </label>
                          <textarea
                            value={automation.settings?.template}
                            onChange={(e) => updateAutomationSettings(automation.id, { template: e.target.value })}
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                              isDarkMode
                                ? 'bg-neutral-800 border-neutral-700'
                                : 'bg-white border-neutral-300'
                            }`}
                          />
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
                            Available variables: {'{name}'}, {'{date}'}, {'{time}'}, {'{amount}'}, {'{booking_link}'}
                          </p>
                        </div>

                        {/* Configure Button */}
                        <button
                          onClick={() => setSelectedAutomation(automation)}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          }`}
                        >
                          Advanced Settings
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-neutral-800 hover:bg-neutral-700'
                : 'bg-neutral-200 hover:bg-neutral-300'
            }`}
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            Save Automations
          </button>
        </div>

        {/* Advanced Settings Modal */}
        {selectedAutomation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedAutomation(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div
                className={`w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                } p-6`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      <span className="text-3xl">{selectedAutomation.icon}</span>
                      {selectedAutomation.title}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Advanced configuration options
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAutomation(null)}
                    className={`p-2 rounded-lg ${
                      isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                    } transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Send Method */}
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Send Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['SMS', 'Call', 'Email'].map((method) => (
                        <button
                          key={method}
                          className={`py-3 rounded-lg border font-medium text-sm transition-colors ${
                            method === 'SMS'
                              ? isDarkMode
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : isDarkMode
                              ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                              : 'bg-white border-neutral-300 text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Send Only When
                    </label>
                    <div className="space-y-2">
                      {['Customer has confirmed previous appointments', 'Customer has not opted out', 'During business hours only'].map((condition) => (
                        <label key={condition} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 rounded border-neutral-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                          />
                          <span className={`text-sm ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {condition}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Max Sends */}
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Maximum Sends Per Customer
                    </label>
                    <select
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-300'
                      }`}
                    >
                      <option>No limit</option>
                      <option>1 per week</option>
                      <option>1 per month</option>
                      <option>1 per appointment</option>
                    </select>
                  </div>

                  {/* Test Automation */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Test This Automation
                    </p>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Send a test message to verify everything works correctly
                    </p>
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      className={`w-full px-3 py-2 rounded-lg border mb-3 text-sm ${
                        isDarkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                      }`}
                    />
                    <button className="w-full py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                      Send Test Message
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setSelectedAutomation(null)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-200 hover:bg-neutral-300'
                    }`}
                  >
                    Close
                  </button>
                  <button className="px-6 py-2 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}