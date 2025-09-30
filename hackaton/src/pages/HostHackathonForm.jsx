// Integrated from SubmitIt/src/Pages/HostHackathonForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHackathon } from "../api/hackathon";

const HostHackathonForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    rules: "",
    prizes: "",
    startDate: "",
    endDate: "",
    location: "",
    image: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.title || !formData.tagline || !formData.description) {
      setError("Please fill in all required fields.");
      return;
    }

    const hackathonData = new FormData();
    Object.keys(formData).forEach((key) => {
      hackathonData.append(key, formData[key]);
    });

    try {
      await createHackathon(hackathonData);
      setSuccess("Hackathon created successfully!");
      setTimeout(() => {
        navigate("/"); // Redirect to home or hackathon list page
      }, 2000);
    } catch (err) {
      setError("Failed to create hackathon. Please try again.");
    }
  };

  return (
    <div className="host-hackathon-form">
      <h2>Host a Hackathon</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tagline *</label>
          <input
            type="text"
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label>Rules</label>
          <textarea
            name="rules"
            value={formData.rules}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Prizes</label>
          <textarea
            name="prizes"
            value={formData.prizes}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date *</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            name="image"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <button type="submit" className="submit-button">
          Create Hackathon
        </button>
      </form>
    </div>
  );
};

export default HostHackathonForm;