'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EventCard from '@/components/EventCard';
import { Search, Filter, X } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, weekends, range
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (user && user.role === 'producer') {
      router.push('/producer');
      return;
    }
    fetchEvents();
    fetchRecommendations();
  }, [user, router]);

  const fetchRecommendations = async () => {
    try {
      const userId = user ? user.id : '';
      const res = await fetch(`/api/recommendations?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchEvents = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/events?search=${encodeURIComponent(query)}` : '/api/events';
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(search);
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(e =>
        e.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter === 'weekends') {
      filtered = filtered.filter(e => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
    } else if (dateFilter === 'range' && dateRange.start && dateRange.end) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return eventDate >= start && eventDate <= end;
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setDateFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const displayedEvents = applyFilters();
  const categories = [...new Set(events.map(e => e.category))];
  const locations = [...new Set(events.map(e => e.location))];

  return (
    <div className={styles.page}>
      <div className={styles.searchSection}>
        <div className={`container ${styles.searchContainer}`}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button
              type="button"
              className={styles.filterBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
          </form>

          {showFilters && (
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Date</label>
                <div className={styles.dateFilters}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="all"
                      checked={dateFilter === 'all'}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    All Dates
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="weekends"
                      checked={dateFilter === 'weekends'}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    Weekends Only
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="range"
                      checked={dateFilter === 'range'}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    Date Range
                  </label>
                </div>

                {dateFilter === 'range' && (
                  <div className={styles.dateRange}>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className={styles.dateInput}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className={styles.dateInput}
                    />
                  </div>
                )}
              </div>

              <button onClick={clearFilters} className={styles.clearBtn}>
                <X size={16} /> Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`container ${styles.eventsSection}`}>
        {recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <h2 className={styles.sectionTitle}>Top Picks for You</h2>
            <div className={styles.grid}>
              {recommendations.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className={styles.divider}></div>
          </div>
        )}

        <h2 className={styles.sectionTitle}>All Events</h2>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : displayedEvents.length === 0 ? (
          <div className={styles.noResults}>No events found</div>
        ) : (
          <div className={styles.grid}>
            {displayedEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
