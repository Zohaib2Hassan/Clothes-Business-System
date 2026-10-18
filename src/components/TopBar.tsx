import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  CheckCheck, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  Sparkles, 
  Info, 
  X, 
  Trash2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/api';
import ThemeToggle from './ui/ThemeToggle';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'stock' | 'sale' | 'expense' | 'ai' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Profile dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoadingNotifs(true);
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [user]);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for live notification updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const handleRefreshEvent = () => fetchNotifications();
    window.addEventListener('notifications:refresh', handleRefreshEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', handleRefreshEvent);
    };
  }, [fetchNotifications]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking as read', e);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all as read', e);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      console.error('Error deleting notification', e);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await authFetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error('Error clearing notifications', e);
    }
  };

  // Handle clicking notification item
  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    if (item.link) {
      setShowNotifications(false);
      navigate(item.link);
    }
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  // Get icon by type
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        );
      case 'sale':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case 'expense':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case 'ai':
        return (
          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    notifFilter === 'unread' ? !n.isRead : true
  );

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-[72px] bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 relative z-30 transition-colors">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-800 dark:group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            placeholder={t('topbar.searchPlaceholder', 'Search anything...')} 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Appearance (Theme Toggle) */}
        <ThemeToggle />

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            id="notifications-bell-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                fetchNotifications();
              }
            }}
            className={clsx(
              "relative p-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none cursor-pointer",
              showNotifications && "bg-gray-100 dark:bg-slate-800 text-brand-800 dark:text-brand-400"
            )}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-brand-800 hover:text-brand-900 flex items-center gap-1 transition-colors hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs: All / Unread */}
              <div className="flex border-b border-gray-100 px-4 pt-1 bg-gray-50/50">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={clsx(
                    "px-3 py-2 text-xs font-semibold border-b-2 transition-colors -mb-[1px]",
                    notifFilter === 'all'
                      ? "border-brand-800 text-brand-800"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  className={clsx(
                    "px-3 py-2 text-xs font-semibold border-b-2 transition-colors -mb-[1px]",
                    notifFilter === 'unread'
                      ? "border-brand-800 text-brand-800"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 no-scrollbar">
                {isLoadingNotifs && notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-800" />
                    <p className="text-xs">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                      <CheckCircle2 className="w-6 h-6 text-brand-800" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">All caught up!</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={clsx(
                        "p-3.5 flex gap-3 hover:bg-gray-50 cursor-pointer transition-colors relative group",
                        !item.isRead && "bg-brand-50/15"
                      )}
                    >
                      {getNotificationIcon(item.type)}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1">
                          <p className={clsx(
                            "text-xs truncate",
                            !item.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"
                          )}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator dot */}
                      {!item.isRead && (
                        <div className="w-2 h-2 rounded-full bg-brand-800 shrink-0 mt-1.5" />
                      )}

                      {/* Delete notification button */}
                      <button
                        onClick={(e) => handleDeleteNotification(e, item._id)}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    onClick={handleClearAll}
                    className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/profile');
                    }}
                    className="text-brand-800 hover:underline font-semibold"
                  >
                    Notification Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>

        {/* Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-700 group-hover:border-brand-500 transition-colors overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('topbar.businessOwner', 'Business Owner')}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 md:hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('topbar.businessOwner', 'Business Owner')}</p>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border-b border-gray-100 dark:border-slate-800 cursor-pointer"
              >
                {t('topbar.profile', 'Profile & Settings')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {t('topbar.signOut', 'Sign Out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
