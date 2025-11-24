'use client';
import Link from 'next/link';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './EventCard.module.css';

export default function EventCard({ event }) {
    const router = useRouter();
    const { user } = useAuth();

    const handleInterest = async (e) => {
        e.preventDefault(); // Prevent navigation
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/events/${event.id}/interest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                // Ideally we should update the local state or refetch
                // For now, let's just reload the page or trigger a callback
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to toggle interest', err);
        }
    };

    const isInterested = event.interestedUsers?.includes(user?.id);
    const interestCount = event.interestedUsers?.length || 0;

    return (
        <Link href={`/events/${event.id}`} className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.image} style={{ backgroundImage: `url(${event.image})` }}></div>
                <div className={styles.category}>{event.category}</div>
                <button
                    className={`${styles.interestBtn} ${isInterested ? styles.interested : ''}`}
                    onClick={handleInterest}
                    title="I'm Interested"
                >
                    <Heart size={18} fill={isInterested ? "currentColor" : "none"} />
                    <span>{interestCount}</span>
                </button>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{event.title}</h3>
                <div className={styles.info}>
                    <div className={styles.infoItem}>
                        <Calendar size={16} />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <MapPin size={16} />
                        <span>{event.location}</span>
                    </div>
                </div>
                <div className={styles.footer}>
                    <span className={styles.price}>${event.price}</span>
                    <span className={styles.bookBtn}>Book Now</span>
                </div>
            </div>
        </Link>
    );
}
