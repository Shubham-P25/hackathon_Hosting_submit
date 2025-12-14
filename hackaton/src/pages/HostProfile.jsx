

import { useState, useEffect } from 'react';
import { getHostProfile } from '../api/hostProfile';
import { updateHostFullProfile } from '../api/hostFullProfile';
import { uploadHostProfilePicture } from '../api/profile';
import { Skeleton } from '../ui/Skeleton';
import { motion } from 'framer-motion';

export default function HostProfile() {
  const [host, setHost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');



  useEffect(() => {
    getHostProfile().then(data => {
      setHost(data);
      const profile = data.hostProfile || {};
      
      // Parse JSON fields from database strings
      let achievements = profile.achievements || [];
      if (typeof achievements === 'string') {
        try { achievements = JSON.parse(achievements); } catch { achievements = []; }
      }
      
      let socialLinks = profile.socialLinks || {};
      if (typeof socialLinks === 'string') {
        try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
      }
      
      // Merge role from user table into formData for display only
      setFormData({
        ...profile,
        role: data.role || 'HOST',
        email: data.email || '',
        name: data.name || '',
        // Use parsed JSON fields
        achievements,
        socialLinks,
      });
    });
  }, []);

  if (!formData) return <div className="max-w-4xl mx-auto py-12"><div className="animate-pulse h-32 bg-gray-200 rounded-xl" /></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleAddSkill = () => {
    if (newSkill && !formData.skills?.includes(newSkill)) {
      setFormData(prev => ({ ...prev, skills: [...(prev.skills || []), newSkill] }));
      setNewSkill('');
    }
  };
  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleAddAchievement = () => {
    if (newAchievement && !formData.achievements?.includes(newAchievement)) {
      setFormData(prev => ({ ...prev, achievements: [...(prev.achievements || []), newAchievement] }));
      setNewAchievement('');
    }
  };
  const handleRemoveAchievement = (ach) => {
    setFormData(prev => ({ ...prev, achievements: prev.achievements.filter(a => a !== ach) }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, profilePicUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let result;
      
      if (profilePicFile) {
        // Upload profile picture and profile data together
        const payload = { ...formData };
        // Remove role and gender (not DB fields)
        delete payload.role;
        delete payload.gender;
        delete payload.profilePicUrl; // Remove base64 data, let the upload handle it
        
        result = await uploadHostProfilePicture(profilePicFile, payload);
        setProfilePicFile(null); // Clear the file after successful upload
      } else {
        // Send all fields in one call
        const payload = { ...formData };
        // Remove role and gender (not DB fields)
        delete payload.role;
        delete payload.gender;
        
        console.log('HostProfile - Sending payload:', payload);
        console.log('HostProfile - Achievements:', payload.achievements);
        
        // Save
        result = await updateHostFullProfile(payload);
      }
      const updated = result.hostProfile || {};
      
      // Parse JSON fields from database strings
      let achievements = updated.achievements || [];
      if (typeof achievements === 'string') {
        try { achievements = JSON.parse(achievements); } catch { achievements = []; }
      }
      
      let socialLinks = updated.socialLinks || {};
      if (typeof socialLinks === 'string') {
        try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
      }
      
      // Update form data with parsed fields
      setFormData({ 
        ...updated, 
        achievements, 
        socialLinks, 
        name: result.user?.name || formData.name, 
        email: result.user?.email || formData.email,
        role: host?.role || 'HOST' // Always preserve role
      });
      setShowToast(true);
      setToastMsg('Profile saved!');
      setIsEditing(false);
    } catch (err) {
      setShowToast(true);
      setToastMsg('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const variants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: 30 }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#FFFFF9] via-[#FEFFF2] to-[#F2FAFF] py-16 px-2 sm:px-8 lg:px-24"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div className="bg-gradient-to-br from-[#CEF9FF] via-[#DACEFF] via-[#B8FFCB] to-[#ECFFB8] backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden p-8 border border-white/30" variants={variants}>
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
            <div className="relative group">
              <div className="h-36 w-36 rounded-full border-4 border-white overflow-hidden bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center shadow-xl">
                {formData.profilePicUrl ? (
                  <img src={formData.profilePicUrl} alt={formData.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-gray-400">
                    {formData.name?.charAt(0) || ''}
                  </span>
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Change Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                </label>
              )}
            </div>
            <div className="flex-1 w-full flex flex-col gap-2 items-center sm:items-start">
              <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
              <p className="text-gray-600 text-lg">{formData.email}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="bg-gradient-to-r from-red-200 to-pink-100 px-3 py-1 h-8 rounded-full text-gray-700 text-sm font-semibold shadow">Role: {host?.role || 'HOST'}</span>
                  {/* Gender is not in HostProfile, so only show if present */}
                  {formData.gender && (
                    <span className="bg-gradient-to-r from-pink-100 to-red-100 px-3 py-1 rounded-full text-gray-700 text-sm font-semibold shadow">Gender: {formData.gender}</span>
                  )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {!isEditing ? (
                <button
                  className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-6 py-2 rounded-full shadow-lg hover:from-pink-500 hover:to-red-400 font-bold text-lg transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-4">
                  <button
                    className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-200 font-semibold shadow"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-5 py-2 rounded-full border border-red-600 hover:from-pink-500 hover:to-red-400 font-bold shadow"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Name</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.name}</p>
              ) : (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your name"
                />
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Email</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.email}</p>
              ) : (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your email"
                />
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Location</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.location || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your location"
                />
              )}
            </motion.div>
            {/* College or Company */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Occupation</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.collegeOrCompany || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="collegeOrCompany"
                  value={formData.collegeOrCompany || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your college or company"
                />
              )}
            </motion.div>
            {/* College Name or Company Name */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Branch</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.clgNameorCmpName || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="clgNameorCmpName"
                  value={formData.clgNameorCmpName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your college/company name"
                />
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Profession</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.profession || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="profession"
                  value={formData.profession || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your profession"
                />
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Bio</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[40px]">{formData.bio || <span className="text-gray-400">No bio added</span>}</p>
              ) : (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Write something about yourself..."
                />
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Achievements</h3>
              <ul className="text-red-700 min-h-[32px] space-y-1">
                {formData.achievements?.length ? formData.achievements.map((ach, i) => (
                  <li key={i} className="flex items-center justify-between bg-transparent px-3 py-1 rounded">
                    <span>{ach}</span>
                    {isEditing && (
                      <button onClick={() => handleRemoveAchievement(ach)} className="text-red-500 hover:text-red-700 ml-2">×</button>
                    )}
                  </li>
                )) : <li className="text-gray-400">No achievements yet</li>}
              </ul>
              {isEditing && (
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={e => setNewAchievement(e.target.value)}
                    className="flex-1 rounded-l-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                    placeholder="Add achievement..."
                  />
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-5 py-2 rounded-r-xl hover:from-pink-500 hover:to-red-400 font-bold text-base shadow"
                  >Add</button>
                </div>
              )}
            </motion.div>
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Social Links</h3>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-20 text-gray-600 capitalize">github:</span>
                  {!isEditing ? (
                    formData.socialLinks?.github ? (
                      <a
                        href={formData.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline"
                      >
                        {formData.socialLinks.github}
                      </a>
                    ) : <span className="text-gray-400">Not set</span>
                  ) : (
                    <input
                      type="text"
                      value={formData.socialLinks?.github || ''}
                      onChange={e => handleSocialLinkChange('github', e.target.value)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                      placeholder="Add github link..."
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-20 text-gray-600 capitalize">linkedin:</span>
                  {!isEditing ? (
                    formData.socialLinks?.linkedin ? (
                      <a
                        href={formData.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline"
                      >
                        {formData.socialLinks.linkedin}
                      </a>
                    ) : <span className="text-gray-400">Not set</span>
                  ) : (
                    <input
                      type="text"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={e => handleSocialLinkChange('linkedin', e.target.value)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                      placeholder="Add linkedin link..."
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-20 text-gray-600 capitalize">twitter:</span>
                  {!isEditing ? (
                    formData.socialLinks?.twitter ? (
                      <a
                        href={formData.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline"
                      >
                        {formData.socialLinks.twitter}
                      </a>
                    ) : <span className="text-gray-400">Not set</span>
                  ) : (
                    <input
                      type="text"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={e => handleSocialLinkChange('twitter', e.target.value)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                      placeholder="Add twitter link..."
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        {showToast && (
          <motion.div
            className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onAnimationComplete={() => setTimeout(() => setShowToast(false), 2000)}
          >
            {toastMsg}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}