'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useOrg } from '@/hooks/use-org';
import { useTheme } from '@/components/theme-provider';
import {
  Bell,
  Search,
  User,
  Sun,
  Moon,
  AlertTriangle,
  MessageSquare,
  Clock,
  RefreshCw,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'breach' | 'whatsapp' | 'pm' | 'renewal';
  title: string;
  subtitle: string;
  time: string;
  unread: boolean;
  link: string;
  severity: 'critical' | 'info' | 'warning' | 'success';
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'breach',
    title: 'SLA Breach Alarm: Job #JOB-01042',
    subtitle: 'Resolution clock exceeded P1 target by 14 minutes.',
    time: '12m ago',
    unread: true,
    link: '/dashboard',
    severity: 'critical',
  },
  {
    id: 'n2',
    type: 'whatsapp',
    title: 'Inbound WhatsApp Complaint Intake',
    subtitle: 'New ticket #TKT-01045 auto-created from verified gateway.',
    time: '34m ago',
    unread: true,
    link: '/dashboard',
    severity: 'info',
  },
  {
    id: 'n3',
    type: 'pm',
    title: 'Preventive Maintenance Window Overdue',
    subtitle: 'Quarterly visit for Contract #AMC-2026-089 exceeds grace period.',
    time: '2h ago',
    unread: true,
    link: '/dashboard',
    severity: 'warning',
  },
  {
    id: 'n4',
    type: 'renewal',
    title: 'Upcoming Contract Expiry Notice',
    subtitle: 'Contract #AMC-2026-0042 expires in 17 days (Value: ₹1,20,000).',
    time: '5h ago',
    unread: false,
    link: '/renewals',
    severity: 'info',
  },
];

export function Header() {
  const { person, membership } = useOrg();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close notification popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'critical') return n.severity === 'critical';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'breach':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'pm':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'renewal':
        return <RefreshCw className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between transition-colors z-20">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-80 text-sm text-slate-500 dark:text-slate-400">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search tickets, jobs, contracts..."
          className="bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Interactive Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-all ${
              showNotifications
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 ring-2 ring-blue-500/20'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
            )}
          </button>

          {/* Notification Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/5">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Live Operations Center
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 rounded"
                        title="Clear all notifications"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mt-3 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                      filter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('unread')}
                    className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                      filter === 'unread'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('critical')}
                    className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                      filter === 'critical'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Breaches
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2Icon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div>All caught up! No active alerts in this category.</div>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                        n.unread ? 'bg-blue-50/40 dark:bg-blue-950/25' : ''
                      }`}
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={n.link}
                            onClick={() => setShowNotifications(false)}
                            className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                          >
                            {n.title}
                          </Link>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                          {n.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {n.time}
                          </span>
                          {n.severity === 'critical' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              Critical
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Quick Action Icons */}
                      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n.unread && (
                          <button
                            type="button"
                            onClick={(e) => markAsRead(n.id, e)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => removeNotification(n.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                          title="Dismiss"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 absolute right-3.5 top-5 group-hover:hidden" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View All Live Metrics <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:border-slate-800" />

        {/* User Profile Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left text-xs hidden sm:block">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {person?.full_name || 'Administrator'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] dark:bg-slate-800 dark:text-slate-300">
                {membership.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx={12} cy={12} r={10} />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
