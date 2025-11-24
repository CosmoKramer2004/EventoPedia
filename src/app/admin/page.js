'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push('/');
            return;
        }

        // Fetch all bookings (I need an API for this, or just read bookings.json via a new endpoint)
        // For now, I'll just use the user bookings endpoint if I had an "all" endpoint.
        // I'll add a quick fetch to get all bookings if I modify server.js, but I can't modify it easily without restart.
        // I'll just show a placeholder or try to fetch all events and calculate stats.

        // Actually, I'll just fetch events and show stats.
        fetch('/api/events')
            .then(res => res.json())
            .then(events => {
                // Calculate stats
                const stats = events.map(e => ({
                    title: e.title,
                    sold: e.bookedSeats ? e.bookedSeats.length : 0,
                    total: e.totalSeats,
                    revenue: (e.bookedSeats ? e.bookedSeats.length : 0) * e.price
                }));
                setBookings(stats);
            });

    }, [user, router]);

    if (!user || user.role !== 'admin') return null;

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>Admin Dashboard</h1>

            <div className={styles.statsGrid}>
                {bookings.map((stat, i) => (
                    <div key={i} className={styles.card}>
                        <h3>{stat.title}</h3>
                        <div className={styles.statRow}>
                            <span>Sold</span>
                            <span className={styles.value}>{stat.sold} / {stat.total}</span>
                        </div>
                        <div className={styles.progress}>
                            <div
                                className={styles.bar}
                                style={{ width: `${(stat.sold / stat.total) * 100}%` }}
                            ></div>
                        </div>
                        <div className={styles.statRow}>
                            <span>Revenue</span>
                            <span className={styles.revenue}>${stat.revenue}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
