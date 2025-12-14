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
        {/* Header with Profile Picture and Basic Info */}
        <div className="flex items-start space-x-6 mb-6">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {profile.profilePicUrl ? (
              <img
                src={profile.profilePicUrl}
                alt={user.name}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                onClick={() => setShowImagePreview(true)}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=96&background=6366f1&color=ffffff`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'H'}
                </span>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
            <p className="text-gray-600 mb-2">{user.email}</p>
            
            {profile.profession && (
              <p className="text-lg font-medium text-blue-600 mb-2">{profile.profession}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {profile.location && (
                <span className="flex items-center">
                  📍 {profile.location}
                </span>
              )}
              {profile.domain && (
                <span className="flex items-center">
                  💼 {profile.domain}
                </span>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <Link
            to="/profile"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Education & Company */}
          {(profile.education || profile.collegeOrCompany) && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Background</h3>
              <div className="space-y-1 text-gray-700">
                {profile.education && <p>🎓 {profile.education}</p>}
                {profile.collegeOrCompany && <p>🏢 {profile.collegeOrCompany}</p>}
              </div>
            </div>
          )}

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(socialLinks).map(([platform, url]) => 
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      {platform === 'github' && '🐱'}
                      {platform === 'linkedin' && '💼'}
                      {platform === 'twitter' && '🐦'}
                      <span className="ml-1 capitalize">{platform}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        {profile.achievements && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Achievements</h3>
            <p className="text-gray-700">{profile.achievements}</p>
          </div>
        )}
      </div>

      {/* Hosted Hackathons */}
      {user.hostedHackathons && user.hostedHackathons.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Hosted Hackathons ({user.hostedHackathons.length})</h2>
          <div className="space-y-3">
            {user.hostedHackathons.map((hackathon) => (
              <div key={hackathon.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">{hackathon.title}</h3>
                <p className="text-sm text-gray-600">
                  {formatDateTime(hackathon.startDate)} - {formatDateTime(hackathon.endDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Picture Preview Modal */}
      {showImagePreview && profile.profilePicUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="max-w-2xl max-h-2xl">
            <img
              src={profile.profilePicUrl}
              alt={user.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}