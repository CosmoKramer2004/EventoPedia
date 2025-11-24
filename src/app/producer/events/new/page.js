'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css'; // Reuse dashboard styles partially or create new

export default function CreateEvent() {
    const { user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        price: '',
        totalSeats: 100,
        rows: 10,
        cols: 10,
        category: '',
        image: '/images/concert.png' // Default image for now
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    totalSeats: Number(formData.rows) * Number(formData.cols),
                    rows: Number(formData.rows),
                    cols: Number(formData.cols),
                    producerId: user.id
                })
            });

            if (res.ok) {
                router.push('/producer');
            } else {
                alert('Failed to create event');
            }
        } catch (err) {
            alert('Error creating event');
        }
    };

    if (!user || user.role !== 'producer') return null;

    return (
        <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '30px' }}>Create New Event</h1>

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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="field">
                        <label>Rows</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.rows}
                            onChange={e => setFormData({ ...formData, rows: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Columns</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.cols}
                            onChange={e => setFormData({ ...formData, cols: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Image URL (Use /images/concert.png, /images/conference.png, or /images/comedy.png)</label>
                    <input
                        className="input"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>Create Event</button>
            </form>
        </div>
    );
}
