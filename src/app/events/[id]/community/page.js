'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Send } from 'lucide-react';
import styles from './page.module.css';

export default function EventCommunity({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [event, setEvent] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [commentText, setCommentText] = useState({});
    const [hasBooked, setHasBooked] = useState(false);
    const [isProducer, setIsProducer] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        // Fetch event
        fetch(`/api/events/${id}`)
            .then(res => res.json())
            .then(data => {
                setEvent(data);
                setIsProducer(data.producerId === user.id);
            });

        // Check if user has booked
        fetch(`/api/bookings/user/${user.id}`)
            .then(res => res.json())
            .then(bookings => {
                setHasBooked(bookings.some(b => b.eventId === id));
            });

        fetchPosts();
    }, [id, user, router]);

    const fetchPosts = () => {
        fetch(`/api/posts/${id}`)
            .then(res => res.json())
            .then(setPosts);
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

    const handleHeart = async (postId) => {
        if (!hasBooked) return;

        await fetch(`/api/posts/${postId}/heart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });

        fetchPosts();
    };

    const handleComment = async (postId) => {
        const comment = commentText[postId];
        if (!comment?.trim()) return;

        await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                userName: user.name,
                comment
            })
        });

        setCommentText({ ...commentText, [postId]: '' });
        fetchPosts();
    };

    if (!event) return <div className="container">Loading...</div>;

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>{event.title}</h1>
                <p className={styles.subtitle}>Community</p>
            </div>

            {isProducer && (
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
            )}

            <div className={styles.posts}>
                {posts.length === 0 ? (
                    <div className={styles.empty}>No posts yet</div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className={styles.post}>
                            <div className={styles.postHeader}>
                                <span className={styles.author}>Event Producer</span>
                                <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className={styles.postContent}>{post.content}</p>

                            <div className={styles.actions}>
                                <button
                                    className={`${styles.actionBtn} ${post.hearts?.includes(user.id) ? styles.active : ''}`}
                                    onClick={() => handleHeart(post.id)}
                                    disabled={!hasBooked}
                                    title={hasBooked ? '' : 'Purchase a ticket to interact'}
                                >
                                    <Heart size={18} fill={post.hearts?.includes(user.id) ? 'currentColor' : 'none'} />
                                    <span>{post.hearts?.length || 0}</span>
                                </button>
                                <button className={styles.actionBtn}>
                                    <MessageCircle size={18} />
                                    <span>{post.comments?.length || 0}</span>
                                </button>
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

                            {hasBooked && (
                                <div className={styles.commentForm}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Add a comment..."
                                        value={commentText[post.id] || ''}
                                        onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                                        onKeyPress={e => e.key === 'Enter' && handleComment(post.id)}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleComment(post.id)}
                                    >
                                        Comment
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
