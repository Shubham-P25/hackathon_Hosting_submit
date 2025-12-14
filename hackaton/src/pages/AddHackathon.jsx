import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';

export default function AddHackathon() {
  const steps = [
    {
      label: 'Basic Info',
      fields: ['poster', 'banner', 'title', 'description', 'overview', 'location', 'startDate', 'endDate'],
    },
    {
      label: 'Requirements',
      fields: ['teamSize', 'skillsRequired', 'rules', 'criteria'],
    },
    {
      label: 'Timeline & Rounds',
      fields: ['timeline', 'rounds'],
    },
    {
      label: 'Prizes & FAQs',
      fields: ['prizes', 'faqs', 'gallery'],
    },
    {
      label: 'Contact & Mode',
      fields: ['helpContact', 'mode', 'Is_Paid'],
    },
  ];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    poster: null, // file
    banner: null, // file
    gallery: [], // array of files
    title: "",
    description: "",
    overview: "",
    rules: [""],
    criteria: "",
    timeline: [{ phase: "Registration", date: "", description: "" }],
    rounds: [{ name: "", description: "" }],
    prizes: [{ type: "", amount: "", details: "" }],
    faqs: [{ question: "", answer: "" }],
    updates: [""],
    helpContact: "",
    mode: "ONLINE",
    teamSize: "",
    domain: "",
    skillsRequired: [""],
    startDate: "",
    endDate: "",
    location: "",
    Is_Paid: false
  });
  const posterInputRef = useRef();
  const bannerInputRef = useRef();
  const galleryInputRef = useRef();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [focus, setFocus] = useState({
    title: false,
    domain: false,
    description: false,
    overview: false,
    location: false,
  });
  const token = useSelector(state => state.user.token);
  const navigate = useNavigate();

  // Common styling for inputs and textareas
  const inputClasses = "mt-1 block w-full rounded-xl border-2 border-transparent focus:border-gradient-to-r focus:from-blue-400 focus:to-pink-400 focus:ring-2 focus:ring-blue-200 shadow-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 text-gray-900 font-semibold px-4 py-2 placeholder-gray-400 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]";
  const labelGradient = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent";
  const sectionTitleGradient = "text-2xl font-bold border-b pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent";
  const fieldLabelGradient = "block font-semibold mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent";
  const coolButton = "rounded-lg px-6 py-2 font-bold shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-blue-500 hover:scale-105 transition-all duration-200 border-none";
  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    setForm(prev => ({ ...prev, poster: file }));
  };
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    setForm(prev => ({ ...prev, banner: file }));
  };
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, gallery: files }));
  };
  
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, index, value) => {
    setForm(prev => ({
      ...prev,
      [name]: prev[name].map((item, i) => (i === index ? value : item))
    }));
  };

  const addArrayItem = (name, defaultValue) => {
    setForm(prev => ({
      ...prev,
      [name]: [...prev[name], defaultValue]
    }));
  };

  const removeArrayItem = (name, index) => {
    setForm(prev => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index)
    }));
  };

  const validateForm = (data) => {
    if (!data.title?.trim() || !data.description?.trim() || !data.overview?.trim() || !data.domain?.trim()) {
      return "Please fill in all required fields";
    }
    if (!data.startDate || !data.endDate) {
      return "Start and end dates are required";
    }
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return "End date must be after start date";
    }
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validationError = validateForm(form);
      if (validationError) {
        setMessage(validationError);
        setToast({ open: true, message: validationError, type: "error" });
        setLoading(false);
        return;
      }

      let imageUrls = {};
      
      // Step 1: Upload images to Cloudinary if they exist
      if (form.poster || form.banner || (form.gallery && form.gallery.length > 0)) {
        setToast({ open: true, message: "Uploading images to Cloudinary...", type: "info" });
        
        const imageFormData = new FormData();
        if (form.poster) imageFormData.append('poster', form.poster);
        if (form.banner) imageFormData.append('banner', form.banner);
        if (form.gallery && form.gallery.length > 0) {
          form.gallery.forEach((file) => {
            imageFormData.append('gallery', file);
          });
        }
        
        // Import the upload function
        const { uploadHackathonImages } = await import('../api/hackathon');
        const uploadResult = await uploadHackathonImages(imageFormData);
        
        if (uploadResult.success && uploadResult.data) {
          imageUrls = uploadResult.data;
          setToast({ open: true, message: "Images uploaded successfully!", type: "success" });
        } else {
          throw new Error(uploadResult.error || "Failed to upload images");
        }
      }
      
      // Step 2: Format hackathon data (excluding file objects)
      const formattedData = {
        title: form.title.trim(),
        description: form.description.trim(),
        overview: form.overview.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
  location: form.location?.trim() || null,
        mode: form.mode,
        domain: form.domain.trim(),
        rules: Array.isArray(form.rules)
          ? form.rules.map(rule => rule.trim()).filter(Boolean)
          : [],
        skillsRequired: Array.isArray(form.skillsRequired)
          ? form.skillsRequired.map(skill => skill.trim()).filter(Boolean)
          : [],
        teamSize: form.teamSize ? parseInt(form.teamSize, 10) : null,
        criteria: form.criteria.trim(),
        timeline: Array.isArray(form.timeline)
          ? form.timeline
              .map(phase => ({
                phase: phase.phase?.trim() || "",
                date: phase.date || "",
                description: phase.description?.trim() || ""
              }))
              .filter(phase => phase.phase || phase.date || phase.description)
          : [],
        rounds: Array.isArray(form.rounds)
          ? form.rounds
              .map(round => ({
                name: round.name?.trim() || "",
                description: round.description?.trim() || ""
              }))
              .filter(round => round.name || round.description)
          : [],
        prizes: Array.isArray(form.prizes)
          ? form.prizes
              .map(prize => ({
                type: prize.type?.trim() || "",
                amount: prize.amount?.trim() || "",
                details: prize.details?.trim() || ""
              }))
              .filter(prize => prize.type || prize.amount || prize.details)
          : [],
        faqs: Array.isArray(form.faqs)
          ? form.faqs
              .map(faq => ({
                question: faq.question?.trim() || "",
                answer: faq.answer?.trim() || ""
              }))
              .filter(faq => faq.question || faq.answer)
          : [],
        updates: Array.isArray(form.updates)
          ? form.updates.map(update => update.trim()).filter(Boolean)
          : [],
        helpContact: Array.isArray(form.helpContact)
          ? form.helpContact.map(contact => contact.trim()).filter(Boolean)
          : (form.helpContact
              ? form.helpContact
                  .split(/[\n,;]/)
                  .map(contact => contact.trim())
                  .filter(Boolean)
              : []),
        Is_Paid: !!form.Is_Paid
      };
      
      // Step 3: Create hackathon with image URLs
      setToast({ open: true, message: "Creating hackathon...", type: "info" });
      
      const { createHackathonWithImages } = await import('../api/hackathon');
      const result = await createHackathonWithImages(formattedData, imageUrls);
      
      if (!result || result.error) {
        console.error('Create hackathon API response:', result);
        const serverMessage = result?.message || (typeof result?.error === 'string' ? result.error : null);
        throw new Error(serverMessage || "Failed to create hackathon. Please try again.");
      }
      
      setMessage("Hackathon created successfully!");
      setToast({ open: true, message: "Hackathon created successfully!", type: "success" });
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      console.error('Create hackathon error:', error);
      const errorMsg = error.message || "Network error. Please try again.";
      setMessage(errorMsg);
      setToast({ open: true, message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-8 px-4"><Skeleton height="h-64" /></div>;

  // Progress calculation
  const progress = ((step + 1) / steps.length) * 100;

  // Step icons (for visual effect)
  const stepIcons = [
    <svg key="icon1" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>,
    <svg key="icon2" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>,
    <svg key="icon3" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v6l4 2" /></svg>,
    <svg key="icon4" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20l9-5-9-5-9 5 9 5z" /><path d="M12 12V4" /></svg>,
    <svg key="icon5" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2" /></svg>,
  ];

  // Gradient utility for all text
  const allTextGradient = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent";

  // Helper for animated placeholder
  const getPlaceholder = (field, defaultText, focusText) =>
    focus[field] ? focusText : defaultText;

  return (
    <div className="w-full min-h-screen">
    <motion.div className="max-w-5xl mx-auto py-10 px-4" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
      <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, open: false })} />
      
      {/* Single Card Container for Everything */}
      <motion.div 
        className="p-20 rounded-2xl shadow-2xl bg-gradient-to-br from-yellow-50 to-blue-50 border border-blue-200"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
      >
        <motion.h2 className="text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}>Create New Hackathon</motion.h2>
      {/* Cool Progress Slider */}
      <div className="w-full mb-10">
        <div className="relative flex items-center justify-between">
          {/* Step Circles */}
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center flex-1">
              <motion.div
                className={`z-10 w-10 h-10 flex items-center justify-center rounded-full border-4 transition-all duration-300 cursor-pointer ${i < step ? 'bg-gradient-to-br from-blue-400 to-pink-400 border-pink-400 shadow-lg scale-110' : i === step ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-500 shadow-xl scale-125' : 'bg-gray-200 border-gray-300 scale-100 hover:bg-gray-300 hover:scale-105'}`}
                animate={{ scale: i === step ? 1.15 : 1, boxShadow: i === step ? '0 0 0 4px #c4b5fd55' : 'none' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setStep(i)}
                whileHover={{ scale: i === step ? 1.15 : 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={`text-white text-lg font-bold`}>{stepIcons[i]}</span>
              </motion.div>
              <span className={`mt-2 text-xs font-semibold cursor-pointer ${i <= step ? 'text-blue-700' : 'text-gray-400'} hover:text-blue-500 transition-colors`} onClick={() => setStep(i)}>{s.label}</span>
            </div>
          ))}
          {/* Progress Bar (behind circles) */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 z-0">
            <div className="w-full h-full bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full absolute" />
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full absolute"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
              style={{ left: 0, top: 0, bottom: 0 }}
            />
          </div>
        </div>
      </div>
      <motion.form onSubmit={handleSubmit} className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {/* Step Content */}
        <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }}>
          {step === 0 && (
            <>
              {/* Poster & Banner */}
              <motion.section className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 flex flex-col items-center gap-6" whileHover={{ scale: 1.01 }}>
                <div className="w-full flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                    <label className={`block text-lg font-semibold text-blue-700 ${fieldLabelGradient}`}>Poster Image</label>
                    <input type="file" accept="image/*" onChange={handlePosterChange} ref={posterInputRef} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {form.poster && form.poster instanceof File && (
                      <img src={URL.createObjectURL(form.poster)} alt="Poster Preview" className="mt-2 rounded-xl shadow-lg max-h-40 object-contain" />
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
                    <label className={`block text-lg font-semibold text-purple-700 ${fieldLabelGradient}`}>Banner Image</label>
                    <input type="file" accept="image/*" onChange={handleBannerChange} ref={bannerInputRef} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                    {form.banner && form.banner instanceof File && (
                      <img src={URL.createObjectURL(form.banner)} alt="Banner Preview" className="mt-2 rounded-xl shadow-lg max-h-40 object-contain" />
                    )}
                  </div>
                </div>

              </motion.section>
              {/* Basic Details & Dates */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 mt-8" whileHover={{ scale: 1.01 }}>
                <motion.h3 className={`text-2xl font-bold border-b pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent`}>Basic Details</motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-lg font-semibold text-transparent ${fieldLabelGradient}`}>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      onFocus={() => setFocus(f => ({ ...f, title: true }))}
                      onBlur={() => setFocus(f => ({ ...f, title: false }))}
                      placeholder={getPlaceholder("title", "Enter hackathon title", "Type your awesome hackathon name...")}
                      className={`${inputClasses} text-blue-700 transition-all duration-300`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-base font-medium text-purple-700 ${fieldLabelGradient}`}>Domain *</label>
                    <input
                      type="text"
                      name="domain"
                      value={form.domain}
                      onChange={handleChange}
                      onFocus={() => setFocus(f => ({ ...f, domain: true }))}
                      onBlur={() => setFocus(f => ({ ...f, domain: false }))}
                      placeholder={getPlaceholder("domain", "e.g., AI, Web Development", "What is the domain?")}
                      className={inputClasses + " transition-all duration-300"}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-base font-medium text-blue-700 ${fieldLabelGradient}`}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onFocus={() => setFocus(f => ({ ...f, description: true }))}
                    onBlur={() => setFocus(f => ({ ...f, description: false }))}
                    rows={3}
                    placeholder={getPlaceholder("description", "Brief description of the hackathon", "Describe your hackathon in detail...")}
                    className={inputClasses + " transition-all duration-300"}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium text-purple-700 ${fieldLabelGradient}`}>Overview *</label>
                  <textarea
                    name="overview"
                    value={form.overview}
                    onChange={handleChange}
                    onFocus={() => setFocus(f => ({ ...f, overview: true }))}
                    onBlur={() => setFocus(f => ({ ...f, overview: false }))}
                    rows={4}
                    placeholder={getPlaceholder("overview", "Detailed overview of the hackathon", "Share the full story and goals...")}
                    className={inputClasses + " transition-all duration-300"}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium text-blue-700 ${fieldLabelGradient}`}>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    onFocus={() => setFocus(f => ({ ...f, location: true }))}
                    onBlur={() => setFocus(f => ({ ...f, location: false }))}
                    placeholder={getPlaceholder("location", "Enter hackathon location (optional for online events)", "Where will it happen?")}
                    className={inputClasses + " transition-all duration-300"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-500">Start Date *</label>
                    <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} className={inputClasses} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-500">End Date *</label>
                    <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} className={inputClasses} required />
                  </div>
                </div>
              </motion.section>
            </>
          )}
          {step === 1 && (
            <>
              {/* Requirements */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200" whileHover={{ scale: 1.01 }}>
                <h3 className={allTextGradient + " text-xl font-semibold border-b pb-2"}>Requirements</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Team Size</label>
                  <input type="number" name="teamSize" value={form.teamSize} onChange={handleChange} placeholder="Enter maximum team size" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Required Skills</label>
                  {form.skillsRequired.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={skill} onChange={e => handleArrayChange("skillsRequired", index, e.target.value)} placeholder="Enter required skill" className={inputClasses} />
                      <button type="button" onClick={() => removeArrayItem("skillsRequired", index)} className="px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95">Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("skillsRequired", "")} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner mt-2 px-4 py-2">Add Skill</button>
                </div>
              </motion.section>
              {/* Rules & Criteria */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 mt-8" whileHover={{ scale: 1.01 }}>
                <h3 className={allTextGradient + " text-xl font-semibold border-b pb-2"}>Rules</h3>
                {form.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={rule} onChange={e => handleArrayChange("rules", index, e.target.value)} placeholder={`Rule ${index + 1}`} className={inputClasses} />
                    <button type="button" onClick={() => removeArrayItem("rules", index)} className="px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("rules", "")} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner px-4 py-2">Add Rule</button>
                <div className="mt-6">
                  <label className="block text-gray-700 font-semibold mb-2">Criteria</label>
                  <textarea name="criteria" value={form.criteria} onChange={handleChange} rows="4" placeholder="Enter judging criteria" className={inputClasses} required />
                </div>
              </motion.section>
            </>
          )}
          {step === 2 && (
            <>
              {/* Timeline */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200" whileHover={{ scale: 1.01 }}>
                <h3 className={allTextGradient + " text-xl font-semibold border-b pb-2"}>Timeline</h3>
                {form.timeline.map((phase, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4">
                    <input type="text" value={phase.phase} onChange={e => handleArrayChange("timeline", index, { ...phase, phase: e.target.value })} placeholder="Phase" className={inputClasses} />
                    <input type="date" value={phase.date} onChange={e => handleArrayChange("timeline", index, { ...phase, date: e.target.value })} className={inputClasses} />
                    <input type="text" value={phase.description} onChange={e => handleArrayChange("timeline", index, { ...phase, description: e.target.value })} placeholder="Description" className={inputClasses} />
                    <button type="button" onClick={() => removeArrayItem("timeline", index)} className="px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("timeline", { phase: "", date: "", description: "" })} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner px-4 py-2">Add Timeline Phase</button>
              </motion.section>
              {/* Rounds */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 mt-8" whileHover={{ scale: 1.01 }}>
                <h3 className={allTextGradient + " text-xl font-semibold border-b pb-2"}>Rounds</h3>
                {form.rounds.map((round, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Round Name</label>
                      <input type="text" value={round.name} onChange={e => handleArrayChange('rounds', index, { ...round, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Round Name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea value={round.description} onChange={e => handleArrayChange('rounds', index, { ...round, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Round Description" rows={3} />
                    </div>
                    <button type="button" onClick={() => removeArrayItem('rounds', index)} className="col-span-2 px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95">Remove Round</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('rounds', { name: "", description: "" })} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner mt-2 px-4 py-2">Add Round</button>
              </motion.section>
            </>
          )}
          {step === 3 && (
            <>
              {/* Prizes */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200" whileHover={{ scale: 1.01 }}>
                <h3 className="text-xl font-semibold border-b pb-2">Prizes</h3>
                <div className="space-y-4">
                  {form.prizes.map((prize, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-start">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Prize Type</label>
                        <input type="text" value={prize.type} onChange={e => handleArrayChange("prizes", index, { ...prize, type: e.target.value })} placeholder="e.g., 1st Place" className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input type="text" value={prize.amount} onChange={e => handleArrayChange("prizes", index, { ...prize, amount: e.target.value })} placeholder="e.g., ₹10,000" className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Details</label>
                        <input type="text" value={prize.details} onChange={e => handleArrayChange("prizes", index, { ...prize, details: e.target.value })} placeholder="Additional details" className={inputClasses} />
                      </div>
                      <button type="button" onClick={() => removeArrayItem("prizes", index)} className="px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95 mt-6">Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("prizes", { type: "", amount: "", details: "" })} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner mt-2 px-4 py-2">Add Prize</button>
                </div>
              </motion.section>
              {/* FAQs */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 mt-8" whileHover={{ scale: 1.01 }}>
                <h3 className="text-xl font-semibold border-b pb-2">FAQs</h3>
                {form.faqs.map((faq, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <input type="text" value={faq.question} onChange={e => handleArrayChange("faqs", index, { ...faq, question: e.target.value })} placeholder="Question" className={inputClasses} />
                    <input type="text" value={faq.answer} onChange={e => handleArrayChange("faqs", index, { ...faq, answer: e.target.value })} placeholder="Answer" className={inputClasses} />
                    <button type="button" onClick={() => removeArrayItem("faqs", index)} className="px-3 py-1 rounded-lg font-semibold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow hover:from-pink-500 hover:to-red-500 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("faqs", { question: "", answer: "" })} className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner px-4 py-2">Add FAQ</button>
              </motion.section>

              {/* Gallery Images Section */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200 mt-8" whileHover={{ scale: 1.01 }}>
                <h3 className="text-xl font-semibold border-b pb-2">Gallery Images</h3>
                <div className="flex flex-col items-center gap-4 w-full">
                  <label className={`block text-lg font-semibold text-pink-700 ${fieldLabelGradient}`}>Upload Multiple Gallery Images</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleGalleryChange} 
                    ref={galleryInputRef} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" 
                  />
                  {form.gallery && form.gallery.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                      {form.gallery.filter(file => file instanceof File).map((file, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Gallery Preview ${index + 1}`} 
                            className="rounded-xl shadow-lg h-32 w-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newGallery = form.gallery.filter((_, i) => i !== index);
                              setForm(prev => ({ ...prev, gallery: newGallery }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 text-center">
                    Selected {form.gallery?.filter(file => file instanceof File).length || 0} image(s)
                  </p>
                </div>
              </motion.section>
            </>
          )}
          {step === 4 && (
            <>
              {/* Contact, Mode, and Paid Toggle */}
              <motion.section className="space-y-4 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-blue-200" whileHover={{ scale: 1.01 }}>
                <h3 className="text-xl font-semibold border-b pb-2">Contact, Mode & Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <label className={`block text-blue-700 font-semibold mb-2 ${fieldLabelGradient}`}>Help Contact</label>
                    <input type="text" name="helpContact" value={form.helpContact} onChange={handleChange} placeholder="e.g., email or phone" className={inputClasses} required />
                  </div>
                  <div>
                    <label className={`block text-purple-700 font-semibold mb-2 ${fieldLabelGradient}`}>Mode</label>
                    <select name="mode" value={form.mode} onChange={handleChange} className={inputClasses} required>
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <label className={`block text-pink-700 font-semibold mb-2 ${fieldLabelGradient}`}>Is Paid?</label>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, Is_Paid: !prev.Is_Paid }))} className={`w-24 py-2 rounded-full font-bold shadow transition-all duration-200 border-2 border-pink-400 ${form.Is_Paid ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white scale-105' : 'bg-gray-100 text-gray-700'} hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-pink-200 active:scale-95`}>{form.Is_Paid ? 'Paid' : 'Free'}</button>
                  </div>
                </div>
              </motion.section>
            </>
          )}
        </motion.div>
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className={`px-6 py-2 rounded-xl font-bold shadow-xl border-none transition-all duration-200 ${step === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner'}`}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
              className="rounded-xl px-6 py-2 font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner"
            >
              Next
            </button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className={`rounded-xl px-8 py-3 text-lg tracking-wide font-bold shadow-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-none transition-all duration-200 hover:from-pink-500 hover:to-blue-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 active:scale-95 active:shadow-inner ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Creating..." : "Create Hackathon"}
            </Button>
          )}
        </div>
      </motion.form>
      </motion.div>
    </motion.div>
    </div>
  );
}

