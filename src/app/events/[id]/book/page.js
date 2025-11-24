'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function BookSeats({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [event, setEvent] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            // router.push('/login'); // Commented out for dev, but should be there
        }
        fetchEvent();
    }, [id, user]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${id}`);
            const data = await res.json();
            setEvent(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = async (row, col) => {
        if (!user) {
            alert('Please login to book seats');
            router.push('/login');
            return;
        }

        const seatId = `${row}-${col}`;

        // Check if already booked
        if (event.bookedSeats && event.bookedSeats.includes(seatId)) return;

        // Check if already selected by me (toggle off)
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(s => s !== seatId));
            return;
        }

        // Lock seat
        try {
            const res = await fetch('/api/bookings/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: id, seatId, userId: user.id })
            });

            const data = await res.json();
            if (data.success) {
                setSelectedSeats(prev => [...prev, seatId]);
                setError('');
            } else {
                setError(data.error || 'Failed to lock seat');
                // Refresh event data to show updated locks/bookings
                fetchEvent();
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const handleCheckout = () => {
        if (selectedSeats.length === 0) return;
        // Pass data via query params or state. For simplicity, using query params.
        const seatsParam = selectedSeats.join(',');
        router.push(`/checkout?eventId=${id}&seats=${seatsParam}`);
    };

    if (loading) return <div className="container" style={{ padding: '50px' }}>Loading...</div>;
    if (!event) return <div className="container" style={{ padding: '50px' }}>Event not found</div>;

    const rows = event.rows || 10;
    const cols = event.cols || 10;

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>Select Seats for {event.title}</h1>

            <div className={styles.screen}>SCREEN</div>

            <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {[...Array(rows)].map((_, r) => (
                    [...Array(cols)].map((_, c) => {
                        const seatId = `${r}-${c}`;
                        const isBooked = event.bookedSeats?.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                            <button
                                key={seatId}
                                className={`${styles.seat} ${isBooked ? styles.booked : ''} ${isSelected ? styles.selected : ''}`}
                                onClick={() => handleSeatClick(r, c)}
                                disabled={isBooked}
                                title={`Row ${r + 1}, Seat ${c + 1}`}
                            />
                        );
                    })
                ))}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.seat} ${styles.available}`}></div>
                    <span>Available</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.seat} ${styles.selected}`}></div>
                    <span>Selected</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.seat} ${styles.booked}`}></div>
                    <span>Booked</span>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.footer}>
                <div className={styles.summary}>
                    <span>{selectedSeats.length} seats selected</span>
                    <span className={styles.total}>Total: ${selectedSeats.length * event.price}</span>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleCheckout}
                    disabled={selectedSeats.length === 0}
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}
