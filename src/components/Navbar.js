'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Ticket, User, LogOut, Bell } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user && user.role !== 'producer') {
            fetch(`/api/notifications/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    setUnreadCount(data.filter(n => !n.read).length);
                });
        }
    }, [user]);

    return (
        <nav className={styles.nav}>
            <div className={`container ${styles.container}`}>
                <Link href={user?.role === 'producer' ? '/producer' : '/'} className={styles.logo}>
                    <Ticket size={28} color="var(--primary)" />
                    <span>Eventopedia</span>
                </Link>

                <div className={styles.links}>
                    {(!user || user.role !== 'producer') && <Link href="/" className={styles.link}>Events</Link>}
                    {user ? (
                        <>
                            {user.role !== 'producer' && <Link href="/dashboard" className={styles.link}>My Tickets</Link>}
                            {/* Producer Dashboard link removed as requested */}
                            {user.role === 'admin' && <Link href="/admin" className={styles.link}>Admin</Link>}
                            {user.role !== 'producer' && (
                                <Link href="/notifications" className={styles.notificationLink}>
                                    <Bell size={20} />
                                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                                </Link>
                            )}
                            <div className={styles.userMenu}>
                                <span className={styles.username}>{user.name}</span>
                                <button onClick={logout} className={styles.logoutBtn}>
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link href="/login" className="btn btn-primary">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
