'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, Star } from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(null); // Booking ID being reviewed
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        if (user) {
            fetch(`/api/bookings/user/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    setBookings(data);
                    setLoading(false);
                });
        }
    }, [user]);

    const handleDownload = async (booking) => {
        try {
            const response = await fetch('/api/tickets/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id })
            });

            if (!response.ok) throw new Error('Failed to generate ticket');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${booking.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('Failed to download ticket');
            console.error(err);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: reviewing.eventId,
                    userId: user.id,
                    userName: user.name,
                    rating: reviewData.rating,
                    comment: reviewData.comment
                })
            });
            alert('Review submitted!');
            setReviewing(null);
            setReviewData({ rating: 5, comment: '' });
        } catch (err) {
            alert('Failed to submit review');
        }
    };

    if (!user) return <div className="container">Please login</div>;
    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>My Tickets</h1>

            {bookings.length === 0 ? (
                <div className={styles.empty}>No bookings yet.</div>
            ) : (
                <div className={styles.grid}>
                    {bookings.map(booking => (
                        <div key={booking.id} className={styles.card}>
                            <div className={styles.header}>
                                <h3>{booking.eventTitle}</h3>
                                <span className={styles.date}>{new Date(booking.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.details}>
                                <p>Seats: {booking.seatIds.join(', ')}</p>
                                <p>Location: {booking.eventLocation}</p>
                                <p className={styles.amount}>Total: ${booking.amount}</p>
                            </div>
                            <div className={styles.actions}>
                                <button className="btn btn-secondary" onClick={() => handleDownload(booking)}>
                                    <Download size={16} /> Download Ticket
                                </button>
                                <button className="btn btn-primary" onClick={() => setReviewing(booking)}>
                                    <Star size={16} /> Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewing && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Review {reviewing.eventTitle}</h2>
                        <form onSubmit={submitReview}>
                            <div className={styles.field}>
                                <label>Rating</label>
                                <select
                                    value={reviewData.rating}
                                    onChange={e => setReviewData({ ...reviewData, rating: Number(e.target.value) })}
                                    className="input"
                                >
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Comment</label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                                    className="input"
                                    rows="4"
                                    required
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
