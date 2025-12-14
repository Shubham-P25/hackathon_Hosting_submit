import React, { useState, useEffect } from "react";
import { getToken } from '../api/auth';
import { motion } from 'framer-motion';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/profile`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          }
        });
        const data = await res.json();
        // Merge user and profile fields for unified editing, with fallbacks
        const profile = data.profile || {};
        const merged = {
          ...data,
          ...profile,
          role: data.role,
          dob: profile.dateOfBirth || "",
          location: profile.location || "",
          bio: profile.bio || "",
          skills: profile.skills || [],
          achievements: profile.achievements || [],
          socialLinks: profile.socialLinks || {},
          education: profile.education || "",
          studyYear: profile.studyYear || "",
          collegeName: profile.collegeName || "",
          courseName: profile.courseName || "",
          profession: profile.profession || "",
          domain: profile.domain || "",
          gender: profile.gender || "",
          profilePicUrl: profile.profilePicUrl || "",
        };
        setUser(merged);
        setFormData(merged);
      } catch (err) {
        setUser(null);
        setFormData(null);
      }
    };
    fetchProfile();
  }, []);

  if (!formData) return <div className="max-w-4xl mx-auto py-12"><div className="animate-pulse h-32 bg-gray-200 rounded-xl" /></div>;

  // Profile picture upload handler
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleSave = async () => {
    setIsSaving(true);
    // Prepare payload with only userprofile fields
    let profilePayload = {
      location: formData.location,
      bio: formData.bio,
      skills: formData.skills,
      achievements: formData.achievements,
      socialLinks: formData.socialLinks,
      education: formData.education,
      studyYear: formData.studyYear,
      collegeName: formData.collegeName,
      courseName: formData.courseName,
      profession: formData.profession,
      domain: formData.domain,
      gender: formData.gender,
      profilePicUrl: formData.profilePicUrl,
    };
    // Only add dateOfBirth if valid
    if (formData.dob) {
      const date = new Date(formData.dob);
      if (!isNaN(date.getTime())) {
        profilePayload.dateOfBirth = date.toISOString();
      }
    }
    // Prepare user table payload if name/email changed
    const userPayload = {};
    if (formData.name !== user.name) userPayload.name = formData.name;
    if (formData.email !== user.email) userPayload.email = formData.email;
    try {
      // Update userprofile table
      const resProfile = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(profilePayload)
      });
      if (!resProfile.ok) throw new Error('Failed to update profile');
      const updatedProfile = await resProfile.json();

      // Update user table if needed
      let updatedUser = {};
      if (Object.keys(userPayload).length > 0) {
        const resUser = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify(userPayload)
        });
        if (!resUser.ok) throw new Error('Failed to update user');
        updatedUser = await resUser.json();
      }

      // Merge updated fields
      const merged = {
        ...user,
        ...updatedProfile,
        ...updatedUser,
        role: user.role, // keep role from user table - ALWAYS preserve this
        dob: updatedProfile.dateOfBirth,
        location: updatedProfile.location,
        bio: updatedProfile.bio,
        skills: updatedProfile.skills || [],
        achievements: updatedProfile.achievements || [],
        socialLinks: updatedProfile.socialLinks || {},
        education: updatedProfile.education,
        studyYear: updatedProfile.studyYear,
        collegeName: updatedProfile.collegeName,
        courseName: updatedProfile.courseName,
        profession: updatedProfile.profession,
        domain: updatedProfile.domain,
        gender: updatedProfile.gender,
        profilePicUrl: updatedProfile.profilePicUrl,
        name: updatedUser.name || formData.name,
        email: updatedUser.email || formData.email,
      };
      setUser(merged);
      // Ensure role is preserved in form data as well
      setFormData({
        ...merged,
        role: user.role // Explicitly preserve role
      });
      setIsEditing(false);
      setToastMsg('Profile updated!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('Failed to update profile');
      setShowToast(true);
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
          {/* Profile Header with Picture Edit */}
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
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-red-700 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6" />
                    </svg>
                  </label>
                )}
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col gap-2 items-center sm:items-start">
              <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
              <p className="text-gray-600 text-lg">{formData.email}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="bg-gradient-to-r from-red-200 to-pink-100 px-3 py-1 h-8 rounded-full text-gray-700 text-sm font-semibold shadow">Role: {user?.role || 'User'}</span>
                {!isEditing ? (
                  <span className="bg-gradient-to-r from-pink-100 to-red-100 px-3 py-1 rounded-full text-gray-700 text-sm font-semibold shadow">Gender: {formData.gender || 'N/A'}</span>
                ) : (
                  <div className="relative group">
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      className="appearance-none bg-gradient-to-r from-pink-100 to-red-200 px-6 py-2 rounded-full text-gray-800 text-base font-semibold border-2 border-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-500 shadow-md transition-all duration-200 outline-none pr-10 cursor-pointer hover:from-red-100 hover:to-pink-200"
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="male">♂️ Male</option>
                      <option value="female">♀️ Female</option>
                      <option value="other">⚧️ Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 group-hover:text-red-600 transition-colors">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
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
                    onClick={() => { setFormData(user); setIsEditing(false); }}
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

          {/* Profile Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Name */}
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
            {/* Email */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Email</h3>
              <p className="text-gray-700 min-h-[32px]">{formData.email}</p>
            </motion.div>
            {/* Date of Birth */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Date of Birth</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.dob ? new Date(formData.dob).toLocaleDateString() : 'N/A'}</p>
              ) : (
                <input
                  type="date"
                  name="dob"
                  value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                />
              )}
            </motion.div>
            {/* Location */}
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
            {/* Education */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Education</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.education || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="education"
                  value={formData.education || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your education"
                />
              )}
            </motion.div>
            {/* Study Year */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Study Year</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.studyYear || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="studyYear"
                  value={formData.studyYear || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your study year"
                />
              )}
            </motion.div>
            {/* College Name */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">College Name</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.collegeName || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your college name"
                />
              )}
            </motion.div>
            {/* Course Name */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Course Name</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.courseName || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your course name"
                />
              )}
            </motion.div>
            {/* Profession */}
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
            {/* Domain */}
            <motion.div className="bg-gradient-to-br from-red-200 via-yellow-100 via-orange-100 via-purple-100 to-pink-200 p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Domain</h3>
              {!isEditing ? (
                <p className="text-gray-700 min-h-[32px]">{formData.domain || 'N/A'}</p>
              ) : (
                <input
                  type="text"
                  name="domain"
                  value={formData.domain || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 sm:text-base outline-none"
                  placeholder="Enter your domain"
                />
              )}
            </motion.div>
            {/* Bio */}
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
            {/* Achievements */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Achievements</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {formData.achievements?.length ? formData.achievements.map((ach, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{ach}</span>
                    {isEditing && (
                      <button onClick={() => handleRemoveAchievement(ach)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
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
            {/* Skills */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {formData.skills?.length ? formData.skills.map((skill, index) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                )) : <span className="text-gray-400">No skills added</span>}
              </div>
              {isEditing && (
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    className="flex-1 rounded-l-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                    placeholder="Add skill..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-5 py-2 rounded-r-xl hover:from-pink-500 hover:to-red-400 font-bold text-base shadow"
                  >Add</button>
                </div>
              )}
            </motion.div>
            {/* Social Links */}
            <motion.div className="bg-gradient-to-br from-[#FFCBD8] to-[#FFFFD4] p-6 rounded-2xl shadow-lg border border-pink-200 hover:shadow-2xl transition-all duration-200 col-span-1 sm:col-span-2" whileHover={{ scale: 1.04 }}>
              <h3 className="font-medium text-gray-900 mb-2">Social Links</h3>
              <div className="flex flex-col space-y-2">
                {['github', 'linkedin', 'twitter'].map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <span className="w-20 text-gray-600 capitalize">{platform}:</span>
                    {!isEditing ? (
                      formData.socialLinks?.[platform] ? (
                        <a
                          href={formData.socialLinks[platform]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:underline"
                        >
                          {formData.socialLinks[platform]}
                        </a>
                      ) : <span className="text-gray-400">Not set</span>
                    ) : (
                      <input
                        type="text"
                        value={formData.socialLinks?.[platform] || ''}
                        onChange={e => handleSocialLinkChange(platform, e.target.value)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-pink-50 to-red-100 border-2 border-pink-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-gray-800 font-semibold px-4 py-2 shadow-md placeholder-gray-400 transition-all duration-200 text-base outline-none h-12"
                        placeholder={`Add ${platform} link...`}
                      />
                    )}
                  </div>
                ))}
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