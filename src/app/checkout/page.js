'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const eventId = searchParams.get('eventId');
    const seats = searchParams.get('seats')?.split(',') || [];

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetch(`/api/events/${eventId}`)
                .then(res => res.json())
                .then(data => {
                    setEvent(data);
                    setLoading(false);
                });
        }
    }, [eventId]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate payment delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    eventId,
                    seatIds: seats,
                    amount: seats.length * event.price,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventLocation: event.location
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(data.error);
                setProcessing(false);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            alert('Payment failed');
            setProcessing(false);
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container">Invalid checkout session</div>;

    const total = seats.length * event.price;

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>Checkout</h1>

            <div className={styles.layout}>
                <div className={styles.summary}>
                    <h2>Order Summary</h2>
                    <div className={styles.item}>
                        <span>Event</span>
                        <span>{event.title}</span>
                    </div>
                    <div className={styles.item}>
                        <span>Date</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.item}>
                        <span>Seats</span>
                        <span>{seats.join(', ')}</span>
                    </div>
                    <div className={`${styles.item} ${styles.totalRow}`}>
                        <span>Total</span>
                        <span>${total}</span>
                    </div>
                </div>

                <div className={styles.payment}>
                    <h2>Payment Details</h2>
                    <form onSubmit={handlePayment} className={styles.form}>
                        <div className={styles.field}>
                            <label>Card Number</label>
                            <input type="text" placeholder="0000 0000 0000 0000" className="input" required />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Expiry</label>
                                <input type="text" placeholder="MM/YY" className="input" required />
                            </div>
                            <div className={styles.field}>
                                <label>CVC</label>
                                <input type="text" placeholder="123" className="input" required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processing}>
                            {processing ? 'Processing...' : `Pay $${total}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function Checkout() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
