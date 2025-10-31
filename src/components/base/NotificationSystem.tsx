
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  status: 'seen' | 'unseen';
  created_at: string;
}

interface NotificationSystemProps {
  className?: string;
}

export default function NotificationSystem({ className = '' }: NotificationSystemProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('Voiture.in', {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'seen' })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, status: 'seen' } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'seen' })
        .eq('user_id', user.id)
        .eq('status', 'unseen');

      if (!error) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, status: 'seen' }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'vehicle_match':
        return 'ri-car-line';
      case 'vehicle_inquiry':
        return 'ri-message-2-line';
      case 'requirement_match':
        return 'ri-file-list-line';
      case 'system':
        return 'ri-information-line';
      default:
        return 'ri-notification-2-line';
    }
  };

  const getNotificationColor = (type: string | null) => {
    switch (type) {
      case 'vehicle_match':
        return 'text-green-600 bg-green-100';
      case 'vehicle_inquiry':
        return 'text-blue-600 bg-blue-100';
      case 'requirement_match':
        return 'text-purple-600 bg-purple-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Safe message rendering function to prevent object rendering errors
  const renderNotificationMessage = (message: any) => {
    if (typeof message === 'string') {
      return message;
    }
    
    if (typeof message === 'object' && message !== null) {
      // Handle object messages with for_user and vehicle_title
      if (message.for_user && message.vehicle_title) {
        return `New match for ${message.vehicle_title}`;
      }
      
      // Handle other object structures
      if (message.text) {
        return message.text;
      }
      
      if (message.content) {
        return message.content;
      }
      
      // Fallback for unknown objects
      return 'New notification';
    }
    
    // Fallback for other types
    return String(message || 'New notification');
  };

  const unreadCount = notifications.filter(n => n.status === 'unseen').length;

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
      >
        <i className="ri-notification-2-line text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <i className="ri-notification-2-line text-gray-300 text-3xl mb-2"></i>
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.status === 'unseen' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.related_type)}`}>
                          <i className={`${getNotificationIcon(notification.related_type)} text-sm`}></i>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {renderNotificationMessage(notification.message)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1">
                          {notification.status === 'unseen' && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                              title="Mark as read"
                            >
                              <i className="ri-check-line text-xs"></i>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Delete"
                          >
                            <i className="ri-close-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Utility function to create notifications
export const createNotification = async (
  userId: string,
  message: string,
  relatedId?: string,
  relatedType?: string
) => {
  try {
    // Ensure message is always a string
    const messageText = typeof message === 'string' ? message : JSON.stringify(message);
    
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        message: messageText,
        related_id: relatedId || null,
        related_type: relatedType || null,
        status: 'unseen'
      }]);

    if (error) throw error;
    console.log('✅ Notification created successfully');
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
};
