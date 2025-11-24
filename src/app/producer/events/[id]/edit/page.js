'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function EditEvent({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'producer') {
            if (user?.role !== 'admin') {
                router.push('/');
                return;
            }
        }

        fetch(`/api/events/${id}`)
            .then(res => res.json())
            .then(data => {
                setFormData(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [id, user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    // Don't allow changing rows/cols if seats are booked, but for simplicity we allow it or ignore it.
                    // Ideally we should check if bookedSeats is empty.
                })
            });

            if (res.ok) {
                router.push('/producer');
            } else {
                alert('Failed to update event');
            }
        } catch (err) {
            alert('Error updating event');
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!formData) return <div className="container">Event not found</div>;

    return (
        <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '30px' }}>Edit Event</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="field">
                    <label>Title</label>
                    <input
                        className="input"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="field">
                    <label>Description</label>
                    <textarea
                        className="input"
                        rows="4"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="field">
                        <label>Date</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Time</label>
                        <input
                            type="time"
                            className="input"
                            value={formData.time}
                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Location</label>
                    <input
                        className="input"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="field">
                        <label>Price ($)</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Category</label>
                        <input
                            className="input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Image URL</label>
                    <input
                        className="input"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>Update Event</button>
            </form>
        </div>
    );
}
