'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Send, Heart, MessageCircle } from 'lucide-react';
import styles from './page.module.css';

export default function ProducerEventDetail({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [loading, setLoading] = useState(true);

    // Edit form state
    const [formData, setFormData] = useState(null);

    // Community state
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [commentText, setCommentText] = useState({});

    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!user || user.role !== 'producer') {
            router.push('/');
            return;
        }

        fetchEvent();
        fetchPosts();
    }, [id, user, router]);

    useEffect(() => {
        if (activeTab === 'tickets') {
            fetchBookings();
        }
    }, [activeTab]);

    const fetchEvent = () => {
        fetch(`/api/events/${id}`)
            .then(res => res.json())
            .then(data => {
                setEvent(data);
                setFormData(data);
                setLoading(false);
            });
    };

    const fetchPosts = () => {
        fetch(`/api/posts/${id}`)
            .then(res => res.json())
            .then(setPosts);
    };

    const fetchBookings = () => {
        fetch(`/api/bookings/event/${id}`)
            .then(res => res.json())
            .then(setBookings);
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price)
                })
            });

            if (res.ok) {
                alert('Event updated successfully!');
                fetchEvent();
                setActiveTab('details');
            } else {
                alert('Failed to update event');
            }
        } catch (err) {
            alert('Error updating event');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: id,
                userId: user.id,
                content: newPost
            })
        });

        setNewPost('');
        fetchPosts();
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!event) return <div className="container">Event not found</div>;

    const bookedCount = event.bookedSeats?.length || 0;
    const revenue = bookedCount * event.price;
    const interestedCount = event.interestedUsers?.length || 0;

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{event.title}</h1>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Interested</span>
                        <span className={styles.statValue}>{interestedCount}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Sold</span>
                        <span className={styles.statValue}>{bookedCount} / {event.totalSeats}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Revenue</span>
                        <span className={styles.statValue}>${revenue}</span>
                    </div>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'edit' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('edit')}
                >
                    Edit
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('tickets')}
                >
                    Tickets
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'community' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('community')}
                >
                    Community
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'details' && (
                    <div className={styles.detailsView}>
                        <div className={styles.categoryBadge}>{event.category}</div>
                        <div className={styles.eventImage} style={{ backgroundImage: `url(${event.image})` }}></div>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <Calendar size={20} />
                                <div>
                                    <span className={styles.detailLabel}>Date & Time</span>
                                    <span className={styles.detailValue}>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <MapPin size={20} />
                                <div>
                                    <span className={styles.detailLabel}>Location</span>
                                    <span className={styles.detailValue}>{event.location}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Users size={20} />
                                <div>
                                    <span className={styles.detailLabel}>Capacity</span>
                                    <span className={styles.detailValue}>{event.rows} × {event.cols} seats</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.description}>
                            <h3>Description</h3>
                            <p>{event.description}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && formData && (
                    <form onSubmit={handleUpdateEvent} className={styles.form}>
                        <div className={styles.field}>
                            <label>Title</label>
                            <input
                                className="input"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Image URL</label>
                            <input
                                className="input"
                                value={formData.image}
                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Description</label>
                            <textarea
                                className="input"
                                rows="4"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
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

                        <div className={styles.field}>
                            <label>Location</label>
                            <input
                                className="input"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Price ($)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Category</label>
                                <input
                                    className="input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">Update Event</button>
                    </form>
                )}

                {activeTab === 'tickets' && (
                    <div className={styles.ticketsView}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Ticket Code</th>
                                    <th>Seats</th>
                                    <th>Booked On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className={styles.empty}>No bookings yet</td>
                                    </tr>
                                ) : (
                                    bookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <span className={styles.userName}>{booking.userId?.name || 'Unknown'}</span>
                                                    <span className={styles.userEmail}>{booking.userId?.email}</span>
                                                </div>
                                            </td>
                                            <td className={styles.ticketCode}>{booking.ticketCode || '-'}</td>
                                            <td>
                                                <div className={styles.seats}>
                                                    <span className={styles.seatCount}>{booking.seatIds.length} seats</span>
                                                    <span className={styles.seatList}>{booking.seatIds.join(', ')}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(booking.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'community' && (
                    <div className={styles.communityView}>
                        <div className={styles.createPost}>
                            <h2>Create Post</h2>
                            <form onSubmit={handleCreatePost}>
                                <textarea
                                    className="input"
                                    rows="4"
                                    placeholder="Share an update with your attendees..."
                                    value={newPost}
                                    onChange={e => setNewPost(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary">
                                    <Send size={16} /> Post Update
                                </button>
                            </form>
                        </div>

                        <div className={styles.posts}>
                            {posts.length === 0 ? (
                                <div className={styles.empty}>No posts yet</div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} className={styles.post}>
                                        <div className={styles.postHeader}>
                                            <span className={styles.author}>You</span>
                                            <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className={styles.postContent}>{post.content}</p>

                                        <div className={styles.actions}>
                                            <div className={styles.actionBtn}>
                                                <Heart size={18} />
                                                <span>{post.hearts?.length || 0}</span>
                                            </div>
                                            <div className={styles.actionBtn}>
                                                <MessageCircle size={18} />
                                                <span>{post.comments?.length || 0}</span>
                                            </div>
                                        </div>

                                        {post.comments && post.comments.length > 0 && (
                                            <div className={styles.comments}>
                                                {post.comments.map(comment => (
                                                    <div key={comment.id} className={styles.comment}>
                                                        <span className={styles.commentAuthor}>{comment.userName}</span>
                                                        <p>{comment.comment}</p>
                                                        <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
