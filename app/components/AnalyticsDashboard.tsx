"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type TimeRange = "day" | "week" | "month";

interface CallMetrics {
  inbound: number;
  outbound: number;
  avgDuration: string;
  successRate: number;
  totalMinutes: number;
  peakHour: string;
}

interface RevenueData {
  current: number;
  previous: number;
  growth: number;
  perCall: number;
}

interface ActivityLog {
  id: string;
  type: "inbound" | "outbound";
  customer: string;
  duration: string;
  revenue: number;
  timestamp: string;
  status: "completed" | "missed" | "ongoing";
}

interface HourlyData {
  hour: string;
  calls: number;
  revenue: number;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode class on html element
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    checkDarkMode();

    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Mock data - replace with real API calls
  const callMetrics: CallMetrics = {
    inbound: 247,
    outbound: 183,
    avgDuration: "4m 32s",
    successRate: 94.2,
    totalMinutes: 1834,
    peakHour: "2-3 PM",
  };

  const revenue: RevenueData = {
    current: 8734.50,
    previous: 7245.30,
    growth: 20.5,
    perCall: 20.31,
  };

  const activityLog: ActivityLog[] = [
    {
      id: "1",
      type: "inbound",
      customer: "Sarah Johnson",
      duration: "5m 23s",
      revenue: 125.00,
      timestamp: "2 min ago",
      status: "completed",
    },
    {
      id: "2",
      type: "outbound",
      customer: "Mike Chen",
      duration: "3m 45s",
      revenue: 89.50,
      timestamp: "8 min ago",
      status: "completed",
    },
    {
      id: "3",
      type: "inbound",
      customer: "Alex Rivera",
      duration: "1m 12s",
      revenue: 0,
      timestamp: "12 min ago",
      status: "missed",
    },
    {
      id: "4",
      type: "inbound",
      customer: "Emma Watson",
      duration: "ongoing",
      revenue: 0,
      timestamp: "now",
      status: "ongoing",
    },
  ];

  const hourlyData: HourlyData[] = [
    { hour: "9AM", calls: 12, revenue: 243 },
    { hour: "10AM", calls: 18, revenue: 367 },
    { hour: "11AM", calls: 24, revenue: 489 },
    { hour: "12PM", calls: 31, revenue: 631 },
    { hour: "1PM", calls: 28, revenue: 570 },
    { hour: "2PM", calls: 35, revenue: 712 },
    { hour: "3PM", calls: 29, revenue: 590 },
    { hour: "4PM", calls: 22, revenue: 448 },
  ];

  const maxCalls = Math.max(...hourlyData.map(d => d.calls));

  const totalCalls = callMetrics.inbound + callMetrics.outbound;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-200`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics</h1>
              <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live • Last updated 30s ago
              </p>
            </div>

            {/* Time Range Selector */}
            <div className={`flex gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-neutral-900' : 'bg-white border border-neutral-200'}`}>
              {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                    timeRange === range
                      ? isDarkMode 
                        ? 'bg-white text-neutral-900' 
                        : 'bg-neutral-900 text-white'
                      : isDarkMode
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Calls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Total Calls</p>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                +12.3%
              </span>
            </div>
            <p className="text-4xl font-bold mb-1">{totalCalls}</p>
            <p className={`text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {callMetrics.inbound} in • {callMetrics.outbound} out
            </p>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Revenue</p>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                +{revenue.growth}%
              </span>
            </div>
            <p className="text-4xl font-bold mb-1">${revenue.current.toLocaleString()}</p>
            <p className={`text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
              ${revenue.perCall} per call avg
            </p>
          </motion.div>

          {/* Success Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Success Rate</p>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                +2.1%
              </span>
            </div>
            <p className="text-4xl font-bold mb-1">{callMetrics.successRate}%</p>
            <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${callMetrics.successRate}%` }}
              />
            </div>
          </motion.div>

          {/* Avg Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Avg Duration</p>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 font-medium">
                -32s
              </span>
            </div>
            <p className="text-4xl font-bold mb-1">{callMetrics.avgDuration}</p>
            <p className={`text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {callMetrics.totalMinutes} total minutes
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Hourly Activity Chart */}
          <div className={`lg:col-span-2 p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-1">Call Volume</h3>
                <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Peak hour: {callMetrics.peakHour}
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
                  <span className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
                  <span className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>Revenue</span>
                </div>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-3">
              {hourlyData.map((data, index) => (
                <div key={data.hour} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1 justify-end h-full">
                    {/* Calls bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.calls / maxCalls) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={`w-full rounded-t ${isDarkMode ? 'bg-neutral-600' : 'bg-neutral-400'} min-h-[4px] relative group`}
                    >
                      <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-900 text-white'}`}>
                        {data.calls}
                      </div>
                    </motion.div>
                  </div>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>
                    {data.hour}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Call Distribution */}
          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <h3 className="text-lg font-semibold mb-6">Call Distribution</h3>
            
            <div className="space-y-6">
              {/* Inbound */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>Inbound</span>
                  </div>
                  <span className="text-lg font-bold">{callMetrics.inbound}</span>
                </div>
                <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(callMetrics.inbound / totalCalls) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-neutral-600 h-2 rounded-full"
                  />
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  {((callMetrics.inbound / totalCalls) * 100).toFixed(1)}% of total
                </p>
              </div>

              {/* Outbound */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>Outbound</span>
                  </div>
                  <span className="text-lg font-bold">{callMetrics.outbound}</span>
                </div>
                <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(callMetrics.outbound / totalCalls) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="bg-neutral-400 h-2 rounded-full"
                  />
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  {((callMetrics.outbound / totalCalls) * 100).toFixed(1)}% of total
                </p>
              </div>

              {/* Quick Stats */}
              <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'} space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>AI Response Time</span>
                  <span className="text-sm font-semibold">0.8s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>AI Accuracy</span>
                  <span className="text-sm font-semibold">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>System Uptime</span>
                  <span className="text-sm font-semibold">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'} transition-colors`}>
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {activityLog.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  activity.status === 'ongoing'
                    ? isDarkMode 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-emerald-50 border-emerald-200'
                    : activity.status === 'missed'
                    ? isDarkMode
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-red-50 border-red-200'
                    : isDarkMode
                    ? 'bg-neutral-800/50 border-neutral-800'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    activity.type === 'inbound' 
                      ? isDarkMode
                        ? 'bg-neutral-800 text-neutral-300'
                        : 'bg-neutral-200 text-neutral-700'
                      : isDarkMode
                      ? 'bg-neutral-700 text-neutral-300'
                      : 'bg-neutral-300 text-neutral-700'
                  }`}>
                    {activity.type === 'inbound' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div className="font-medium">{activity.customer}</div>
                    <div className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      <span>{activity.duration}</span>
                      <span>•</span>
                      <span className="text-xs">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  {activity.revenue > 0 && (
                    <div className="font-semibold">
                      +${activity.revenue.toFixed(2)}
                    </div>
                  )}
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    activity.status === 'ongoing' 
                      ? 'bg-emerald-500/10 text-emerald-600' :
                    activity.status === 'missed' 
                      ? 'bg-red-500/10 text-red-600' :
                    isDarkMode
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {activity.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Total Customers</p>
            <p className="text-3xl font-bold">1,247</p>
          </div>
          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Lifetime Revenue</p>
            <p className="text-3xl font-bold">$124.5K</p>
          </div>
          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>Avg Response Time</p>
            <p className="text-3xl font-bold">42 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}