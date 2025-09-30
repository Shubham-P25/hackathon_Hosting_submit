import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHackathons, registerHackathon } from "../slices/hackathonSlice";
import HackathonCard from "../components/HackathonCard";
import { Search } from '../ui/Search';
import { Skeleton } from '../ui/Skeleton';
import { Toast } from '../ui/Toast';

export default function Hackathons() {
  const dispatch = useDispatch();
  const { hackathons, loading, error, registrationMessage } = useSelector((state) => state.hackathon);
  const token = useSelector(state => state.user.token);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [filteredHackathons, setFilteredHackathons] = useState(hackathons);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  useEffect(() => {
    dispatch(fetchHackathons());
  }, [dispatch]);

  useEffect(() => {
    setFilteredHackathons(
      hackathons.filter(hackathon => {
        const matchesSearch = !searchTerm || 
          (hackathon?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           hackathon?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDomain = selectedDomain === 'all' || 
          hackathon?.domain === selectedDomain;
        return matchesSearch && matchesDomain;
      })
    );
  }, [searchTerm, selectedDomain, hackathons]);

  const handleRegister = (id) => {
    if (!token) {
      setToast({ open: true, message: 'You must be logged in to register for a hackathon.', type: 'error' });
      return;
    }
    dispatch(registerHackathon(id));
    setToast({ open: true, message: 'Registration requested!', type: 'success' });
  };

  const handleToastClose = () => setToast({ ...toast, open: false });

  const hackathonList = Array.isArray(hackathons) ? hackathons : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">View Every Hackathons We Have Here...</h1>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Search
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search hackathons..."
          className="flex-1"
        />
        <select
          value={selectedDomain}
          onChange={e => setSelectedDomain(e.target.value)}
          className="p-2 border rounded-md md:w-48"
        >
          <option value="all">All Domains</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
          <option value="ai">AI/ML</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="h-48" />)
        ) : hackathonList.length ? (
          filteredHackathons.map(hackathon => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} onRegister={handleRegister} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-10">No hackathons found</div>
        )}
      </div>
      <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={handleToastClose} />
      {error && <div className="text-center py-10 text-red-500">{error}</div>}
    </div>
  );
}