'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, Clock, Star, Heart, MessageSquare } from 'lucide-react';
import styles from './page.module.css';

export default function EventDetails({ params }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/events/${id}`)
            .then(res => res.json())
            .then(data => {
                setEvent(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [id]);

    const handleInterest = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`/api/events/${id}/interest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                const data = await res.json();
                setEvent(prev => ({ ...prev, interestedUsers: data.interestedUsers }));
            }
        } catch (err) {
            console.error('Failed to toggle interest', err);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!event) return <div className={styles.error}>Event not found</div>;

    const isInterested = event.interestedUsers?.includes(user?.id);
    const interestCount = event.interestedUsers?.length || 0;

    return (
        <div className={styles.page}>
            <div className={styles.hero} style={{ backgroundImage: `url(${event.image})` }}>
                <div className={styles.overlay}></div>
                <div className={`container ${styles.heroContent}`}>
                    <span className={styles.category}>{event.category}</span>
                    <h1 className={styles.title}>{event.title}</h1>
                    <div className={styles.meta}>
                        <div className={styles.metaItem}>
                            <Calendar size={20} />
                            <span>{new Date(event.date).toLocaleDateString()} • {event.time}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <MapPin size={20} />
                            <span>{event.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`container ${styles.content}`}>
                <div className={styles.main}>
                    <section className={styles.section}>
                        <h2>About the Event</h2>
                        <p>{event.description}</p>
                    </section>

                    <section className={styles.section}>
                        <h2>Reviews</h2>
                        {event.reviews && event.reviews.length > 0 ? (
                            <div className={styles.reviews}>
                                {event.reviews.map((review, index) => (
                                    <div key={index} className={styles.review}>
                                        <div className={styles.reviewHeader}>
                                            <span className={styles.reviewer}>{review.userName}</span>
                                            <div className={styles.rating}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < review.rating ? "currentColor" : "none"}
                                                        className={i < review.rating ? styles.starFilled : styles.starEmpty}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className={styles.comment}>{review.comment}</p>
                                        <span className={styles.date}>{new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.noReviews}>No reviews yet.</p>
                        )}
                    </section>
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.card}>
                        <div className={styles.price}>
                            <span className={styles.currency}>$</span>
                            <span className={styles.amount}>{event.price}</span>
                        </div>
                        <div className={styles.details}>
                            <div className={styles.detailRow}>
                                <span>Date</span>
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Time</span>
                                <span>{event.time}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Location</span>
                                <span>{event.location}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/events/${id}/book`} className="btn btn-primary btn-full">
                                Book Tickets
                            </Link>

                            <button
                                className={`btn btn-outline btn-full ${styles.interestBtn} ${isInterested ? styles.interested : ''}`}
                                onClick={handleInterest}
                            >
                                <Heart size={18} fill={isInterested ? "currentColor" : "none"} />
                                <span>{isInterested ? 'Interested' : "I'm Interested"} ({interestCount})</span>
                            </button>

                            <Link href={`/events/${id}/community`} className="btn btn-secondary btn-full">
                                <MessageSquare size={18} />
                                Join Community
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
