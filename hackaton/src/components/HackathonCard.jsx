import { Link } from 'react-router-dom';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function HackathonCard({ hackathon }) {
  const navigate = useNavigate();
  const user = useSelector(state => state.user);

  const handleApply = () => {
    if (!user?.token) {
      navigate('/login');
      return;
    }
    navigate(`/hackathons/${hackathon.id}/register`);
  };

  const daysLeft = Math.ceil((new Date(hackathon.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-white">
      <img src={hackathon.poster} alt={hackathon.title} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{hackathon.title}</h3>
        <p className="text-blue-600 font-medium mb-4">{hackathon.host?.name}</p>
        
        <div className="mt-2 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Mode:</span>
            <span>{hackathon.mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Domain:</span>
            <span>{hackathon.domain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Participants:</span>
            <span>{hackathon.participants?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prize Pool:</span>
            <span className="text-green-600 font-bold">${hackathon.prizePool}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              daysLeft > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Link 
            to={`/hackathons/${hackathon.id}`}
            className="text-blue-600 hover:underline"
          >
            View Details
          </Link>
          {(!user || user.role !== 'HOST') && (
            <button
              onClick={() => navigate(`/hackathons/${hackathon.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}