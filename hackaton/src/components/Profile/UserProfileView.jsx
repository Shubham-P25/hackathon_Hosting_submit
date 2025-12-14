import React, { useState } from 'react';
import { unregisterFromHackathon } from '../../api';
import { useNavigate } from 'react-router-dom';

export function UserProfileView({ user, formatDateTime }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const navigate = useNavigate();

  const handleUnregister = async (hackathonId) => {
    try {
      setLoading(true);
      await unregisterFromHackathon(hackathonId);
      // Refresh the page to update the registrations list
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/user/profile/edit');
  };

  // Helper function to safely parse JSON
  const safeParse = (jsonString, defaultValue = []) => {
    try {
      return typeof jsonString === 'string' ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue;
    }
  };

  // Helper function to format skills
  const formatSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') {
      return skills.split(',').map(s => s.trim());
    }
    return [];
  };

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* User Info Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              {user.profile?.profilePicUrl ? (
                <img
                  src={user.profile.profilePicUrl}
                  alt={user.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowImagePreview(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl text-gray-400">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/profile/edit')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Education:</span> {user.profile?.education || 'Not specified'}</p>
            <p><span className="font-medium">Study Year:</span> {user.profile?.studyYear || 'Not specified'}</p>
            <p><span className="font-medium">College:</span> {user.profile?.collegeName || 'Not specified'}</p>
            <p><span className="font-medium">Course:</span> {user.profile?.courseName || 'Not specified'}</p>
          </div>

          <div className="space-y-3">
            <p><span className="font-medium">Profession:</span> {user.profile?.profession || 'Not specified'}</p>
            <p><span className="font-medium">Domain:</span> {user.profile?.domain || 'Not specified'}</p>
            <p><span className="font-medium">Location:</span> {user.profile?.location || 'Not specified'}</p>
            {user.profile?.dateOfBirth && (
              <p><span className="font-medium">Date of Birth:</span> {new Date(user.profile.dateOfBirth).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {user.profile?.bio && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Bio</h3>
            <p className="text-gray-600">{user.profile.bio}</p>
          </div>
        )}

        {/* Skills Section */}
        {user.profile?.skills && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {formatSkills(user.profile.skills).map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {user.profile?.achievements && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Achievements</h3>
            <ul className="list-disc list-inside">
              {safeParse(user.profile.achievements).map((achievement, index) => (
                <li key={index} className="text-gray-600">{achievement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Links Section */}
        {user.profile?.socialLinks && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Social Links</h3>
            <div className="flex gap-4">
              {Object.entries(safeParse(user.profile.socialLinks, {})).map(([platform, url]) => 
                url && (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* Registered Hackathons Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-semibold mb-4">Registered Hackathons</h2>
        {user.registrations && user.registrations.length > 0 ? (
          <div className="grid gap-4">
            {user.registrations.map(reg => (
              <div key={reg.id} className="border p-4 rounded">
                <h3 className="font-semibold text-lg">{reg.hackathon?.title}</h3>
                {reg.hackathon && (
                  <>
                    <p className="text-gray-600 mt-1">{reg.hackathon.description}</p>
                    <div className="mt-2 space-y-1">
                      <p><span className="font-medium">Start Date:</span> {formatDateTime(reg.hackathon.startDate)}</p>
                      <p><span className="font-medium">End Date:</span> {formatDateTime(reg.hackathon.endDate)}</p>
                      <p><span className="font-medium">Registration Date:</span> {formatDateTime(reg.createdAt)}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Registered
                        </span>
                      </p>
                    </div>
                  </>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleUnregister(reg.hackathon.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Unregistering...' : 'Unregister'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">You have not registered for any hackathons.</p>
        )}
      </section>

      {/* Image Preview Modal */}
      {showImagePreview && user.profile?.profilePicUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={user.profile.profilePicUrl}
              alt={user.name}
              className="w-full h-auto rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
              onClick={() => setShowImagePreview(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfileView;