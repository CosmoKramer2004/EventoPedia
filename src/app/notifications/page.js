'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import styles from './page.module.css';

export default function Notifications() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        fetchNotifications();
    }, [user, router]);

    const fetchNotifications = () => {
        fetch(`/api/notifications/${user.id}`)
            .then(res => res.json())
            .then(data => {
                setNotifications(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            });
    };

    const markAsRead = async (notificationId) => {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        fetchNotifications();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Notifications</h1>
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount} new</span>
                )}
            </div>

            <div className={styles.notifications}>
                {notifications.length === 0 ? (
                    <div className={styles.empty}>
                        <Bell size={48} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
                        >
                            <div className={styles.notificationContent}>
                                <div className={styles.notificationHeader}>
                                    <span className={styles.eventTitle}>{notification.eventTitle}</span>
                                    <span className={styles.date}>
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={styles.message}>{notification.message}</p>
                                <Link
                                    href={`/events/${notification.eventId}/community`}
                                    className={styles.link}
                                >
                                    View Community →
                                </Link>
                            </div>
                            {!notification.read && (
                                <button
                                    className={styles.markRead}
                                    onClick={() => markAsRead(notification.id)}
                                    title="Mark as read"
                                >
                                    <Check size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
