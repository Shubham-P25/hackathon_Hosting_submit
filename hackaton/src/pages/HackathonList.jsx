import { useState, useEffect } from 'react';
import { getHackathons } from '../api';
import HackathonCard from '../components/HackathonCard';
import { Search } from '../ui/Search';
import { Skeleton } from '../ui/Skeleton';

export default function HackathonList() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    domain: '',
    status: '',
    mode: '',
    sortBy: 'popular'
  });

  useEffect(() => {
    getHackathons().then(data => {
      setHackathons(data);
      setLoading(false);
    });
  }, []);

  const filteredHackathons = hackathons.filter(h => 
    h.title.toLowerCase().includes(filters.search.toLowerCase()) &&
    (!filters.location || h.location === filters.location) &&
    (!filters.domain || h.domain === filters.domain) &&
    (!filters.mode || h.mode === filters.mode)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <Search
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search hackathons..."
            className="mb-2"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filters.location}
              onChange={e => setFilters({ ...filters, location: e.target.value })}
              className="p-2 border rounded-md"
            >
              <option value="">Location</option>
              <option value="online">Online</option>
              <option value="onsite">Onsite</option>
            </select>
            <select
              value={filters.domain}
              onChange={e => setFilters({ ...filters, domain: e.target.value })}
              className="p-2 border rounded-md"
            >
              <option value="">Domain</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="ai">AI/ML</option>
            </select>
            <select
              value={filters.mode}
              onChange={e => setFilters({ ...filters, mode: e.target.value })}
              className="p-2 border rounded-md"
            >
              <option value="">Mode</option>
              <option value="team">Team</option>
              <option value="individual">Individual</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
              className="p-2 border rounded-md"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="prize">Highest Prize</option>
            </select>
          </div>
        </div>

        {/* Hackathon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="h-48" />)
          ) : filteredHackathons.length ? (
            filteredHackathons.map(hackathon => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">No hackathons found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
