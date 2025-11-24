'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Calendar } from 'lucide-react';
import styles from './page.module.css';

export default function ProducerDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'producer') {
            // Allow admin to see this too? Maybe not.
            if (user?.role !== 'admin') {
                router.push('/');
                return;
            }
        }

        // Fetch producer events
        // If admin, maybe show all? For now, let's just show events where producerId matches user.id
        // But wait, existing events don't have producerId.
        // I'll update the fetch to handle this.

        const endpoint = user.role === 'admin' ? '/api/events' : `/api/events/producer/${user.id}`;

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            });
    }, [user, router]);

    if (!user) return null;

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Producer Dashboard</h1>
                <Link href="/producer/events/new" className="btn btn-primary">
                    <Plus size={18} /> Create Event
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : events.length === 0 ? (
                <div className={styles.empty}>
                    <p>You haven't created any events yet.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {events.map(event => (
                        <Link href={`/producer/events/${event.id}`} key={event.id} className={styles.card}>
                            <div className={styles.cardImage} style={{ backgroundImage: `url(${event.image})` }}></div>
                            <div className={styles.cardContent}>
                                <h3>{event.title}</h3>
                                <div className={styles.meta}>
                                    <span><Calendar size={14} /> {new Date(event.date).toLocaleDateString()}</span>
                                    <span>${event.price}</span>
                                </div>
                                <div className={styles.stats}>
                                    <span>Sold: {event.bookedSeats ? event.bookedSeats.length : 0} / {event.totalSeats}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
