import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function HostProfileView({ user, formatDateTime }) {
  const [showImagePreview, setShowImagePreview] = useState(false);

  if (!user) return <div className="p-6 text-center">No host data available</div>;

  const profile = user.hostProfile || {};
  
  // Parse social links safely
  const socialLinks = (() => {
    if (!profile.socialLinks) return {};
    try {
      return typeof profile.socialLinks === 'string' 
        ? JSON.parse(profile.socialLinks) 
        : profile.socialLinks;
    } catch {
      return {};
    }
  })();

  return (
    <>
      {/* Host Profile Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              {user.hostProfile?.profilePicUrl ? (
                <img
                  src={user.hostProfile.profilePicUrl}
                  alt={user.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowImagePreview(true)}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128&background=6366f1&color=ffffff`;
                  }}
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
            onClick={() => navigate('/host/profile/edit')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Organization:</span> {user.hostProfile?.collegeOrCompany || 'Not specified'}</p>
            <p><span className="font-medium">Profession:</span> {user.hostProfile?.profession || 'Not specified'}</p>
          </div>
          <div className="space-y-3">
            <p><span className="font-medium">Domain:</span> {user.hostProfile?.domain || 'Not specified'}</p>
            <p><span className="font-medium">Location:</span> {user.hostProfile?.location || 'Not specified'}</p>
          </div>
        </div>

        {user.hostProfile?.bio && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Bio</h3>
            <p className="text-gray-600">{user.hostProfile.bio}</p>
          </div>
        )}

        {/* Achievements Section */}
        {user.hostProfile?.achievements && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Achievements</h3>
            <ul className="list-disc list-inside">
              {safeParse(user.hostProfile.achievements, []).map((achievement, index) => (
                <li key={index} className="text-gray-600">{achievement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Links Section */}
        {user.hostProfile?.socialLinks && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Social Links</h3>
            <div className="flex gap-4">
              {Object.entries(safeParse(user.hostProfile.socialLinks)).map(([platform, url]) => 
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
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && user.hostProfile?.profilePicUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={user.hostProfile.profilePicUrl}
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

      {/* Hosted Hackathons Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Hosted Hackathons</h2>
          <Link
            to="/add-hackathon"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Host New Hackathon
          </Link>
        </div>
        
        {user.hostedHackathons?.length > 0 ? (
          <div className="grid gap-4">
            {user.hostedHackathons.map(hackathon => (
              <div key={hackathon.id} className="border p-4 rounded">
                <h3 className="font-semibold text-lg">{hackathon.title}</h3>
                <p className="text-gray-600 mt-1">{hackathon.description}</p>
                <div className="mt-2 space-y-1">
                  <p><span className="font-medium">Start Date:</span> {formatDateTime(hackathon.startDate)}</p>
                  <p><span className="font-medium">End Date:</span> {formatDateTime(hackathon.endDate)}</p>
                  <p><span className="font-medium">Registrations:</span> {hackathon.registrations?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">You haven't hosted any hackathons yet.</p>
        )}
      </section>
    </>
  );
}

export default HostProfileView;