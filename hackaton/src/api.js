const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// Auth
export const register = async (data) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      return data;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Server error during login');
  }
};

export const getMe = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch user data');
    }

    return await res.json();
  } catch (error) {
    console.error('getMe error:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Hackathons
export const getHackathons = async () => {
  try {
    const res = await fetch(`${API_BASE}/hackathons`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch hackathons');
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('Invalid hackathons data:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Fetch hackathons error:', error);
    return [];
  }
};

export const getHackathonById = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${id}`);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch hackathon');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching hackathon:', error);
    throw new Error('Failed to fetch hackathon');
  }
};

// Delete Hackathon
export const deleteHackathon = async (hackathonId) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Attempting to delete hackathon:', {
      hackathonId,
      url: `${API_BASE}/hackathons/${hackathonId}`,
      token: token.substring(0, 10) + '...'  // Log part of token for debugging
    });

    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
    });

    const data = await res.json();
    console.log('Delete response:', { status: res.status, data });
    
    if (!res.ok) {
      throw new Error(data.message || `Server error: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error('Delete hackathon error:', {
      message: error.message,
      hackathonId,
      stack: error.stack
    });
    return { error: error.message || 'Failed to delete hackathon' };
  }
};

// Registrations
export const registerForHackathon = async (hackathonId, registrationData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to register for hackathons.');
    }

    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hackathonId: parseInt(hackathonId),
        ...registrationData
      })
    });

    if (!res.ok) {
      let errorMessage = 'Failed to register';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // Ignore JSON parse errors and use default message
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error('Please log in to register for hackathons.');
      }

      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register for hackathon');
  }
};

export const checkRegistrationStatus = async (hackathonId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { registered: false };
    }

    const res = await fetch(`${API_BASE}/registrations/status/${hackathonId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // If unauthorized, treat as not registered but prompt login on submit
      if (res.status === 401 || res.status === 403) {
        return { registered: false };
      }

      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to check registration status');
    }

    return await res.json();
  } catch (error) {
    console.error('Registration status error:', error);
    throw error;
  }
};

// Registration Process
export const submitHackathonRegistration = async (hackathonId, registrationData) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(registrationData)
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

// Host APIs
export const updateHostProfile = async (formData) => {
  try {
    const res = await fetch(`${API_BASE}/host/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update host profile');
    }

    const data = await res.json();
    if (data.profilePicUrl) {
      data.profilePicUrl = `${API_BASE}${data.profilePicUrl}`;
    }
    return data;
  } catch (error) {
    console.error('Update host profile error:', error);
    throw error;
  }
};

export const getHostProfile = async () => {
  try {
    const res = await fetch(`${API_BASE}/host/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch host profile');
    }

    const data = await res.json();
    if (data.hostProfile?.profilePicUrl) {
      data.hostProfile.profilePicUrl = `${API_BASE}${data.hostProfile.profilePicUrl}`;
    }
    return data;
  } catch (error) {
    console.error('Get host profile error:', error);
    throw error;
  }
};

// User Profile APIs
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${API_BASE}/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw new Error('Failed to fetch profile');
  }
};

export const updateUserProfile = async (formData) => {
  try {
    // Get the data from FormData
    const dataJson = formData.get('data');
    let data = JSON.parse(dataJson);

    // Convert arrays to proper format before sending
    if (Array.isArray(data.skills)) {
      data.skills = data.skills.join(',');
    }
    if (Array.isArray(data.achievements)) {
      data.achievements = data.achievements.join('\n');
    }

    // Update the FormData with the modified data
    formData.set('data', JSON.stringify(data));

    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return await res.json();
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Create Hackathon
export const createHackathon = async (hackathonData) => {
  try {
    // Ensure hackathonData includes the mode field (online/offline)
    const res = await fetch(`${API_BASE}/hackathons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({
        ...hackathonData,
        mode: hackathonData.mode || 'online' // Default to online if not specified
      })
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const updateHackathon = async (hackathonId, updates) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Failed to update hackathon');
    }

    return data;
  } catch (error) {
    console.error('Update hackathon error:', error);
    throw error;
  }
};

export const uploadHackathonImages = async (formData) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/upload`, {
      method: 'POST',
      headers: {
        ...authHeader()
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || 'Failed to upload images');
    }

    return data;
  } catch (error) {
    console.error('Upload hackathon images error:', error);
    throw error;
  }
};

// Teams
export const getTeamsForHackathon = async (hackathonId) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}/teams`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to load teams');
    }

    return await res.json();
  } catch (error) {
    console.error('Fetch teams error:', error);
    throw error;
  }
};

export const createTeamForHackathon = async (hackathonId, teamData) => {
  try {
    const res = await fetch(`${API_BASE}/hackathons/${hackathonId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(teamData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create team');
    }

    return await res.json();
  } catch (error) {
    console.error('Create team error:', error);
    throw error;
  }
};

export const requestJoinTeam = async (teamId, payload = {}) => {
  try {
    const res = await fetch(`${API_BASE}/teams/${teamId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Unable to join team');
    }

    return data;
  } catch (error) {
    console.error('Join team error:', error);
    throw error;
  }
};

export const getTeamJoinRequests = async () => {
  try {
    const res = await fetch(`${API_BASE}/teams/join-requests`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });

    // Handle common error cases (401, non-JSON responses) safely
    if (res.status === 401) {
      // unauthorized
      const maybeJson = res.headers.get('content-type')?.includes('application/json');
      let msg = 'Unauthorized. Please log in.';
      if (maybeJson) {
        try {
          const err = await res.json();
          msg = err?.message || msg;
        } catch (e) {}
      } else {
        try {
          const txt = await res.text();
          if (txt) msg = txt;
        } catch (e) {}
      }
      throw new Error(msg);
    }

    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        console.error('Failed to parse JSON join-requests response:', e);
        throw new Error('Invalid server response (not valid JSON)');
      }
    } else {
      const txt = await res.text().catch(() => '');
      data = txt ? { message: txt } : {};
    }

    if (!res.ok) {
      throw new Error(data?.message || `Failed to load join requests (status ${res.status})`);
    }

    return data;
  } catch (error) {
    console.error('Fetch join requests error:', error);
    throw error;
  }
};

export const respondToTeamJoinRequest = async (requestId, action) => {
  try {
    const res = await fetch(`${API_BASE}/teams/join-requests/${requestId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ action })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update join request');
    }

    return data;
  } catch (error) {
    console.error('Respond join request error:', error);
    throw error;
  }
};

// Admin APIs
export const getAdminStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: authHeader()
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const getUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: authHeader()
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const getPendingHackathons = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/hackathons/pending`, {
      headers: authHeader()
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const approveHackathon = async (hackathonId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/hackathons/${hackathonId}/approve`, {
      method: 'POST',
      headers: authHeader()
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const getDisputes = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/disputes`, {
      headers: authHeader()
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const resolveDispute = async (disputeId, resolution) => {
  try {
    const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ resolution })
    });
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
};

export const unregisterFromHackathon = async (hackathonId) => {
  try {
    const res = await fetch(`${API_BASE}/registrations/${hackathonId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to unregister');
    }

    return await res.json();
  } catch (error) {
    console.error('Unregister error:', error);
    throw error;
  }
};

// Get single team by id (public)
export const getTeamById = async (teamId) => {
  try {
    const url = `${API_BASE}/teams/${teamId}`;
    const res = await fetch(url);
    if (!res.ok) {
      // try to extract a useful error message
      const contentType = res.headers.get('content-type') || '';
      let errBody = {};
      try {
        if (contentType.includes('application/json')) {
          errBody = await res.json();
        } else {
          errBody = { message: await res.text() };
        }
      } catch (e) {
        errBody = {};
      }
      const message = errBody?.message || errBody?.error || `${res.status} ${res.statusText}` || 'Failed to fetch team';
      throw new Error(message);
    }

    return await res.json();
  } catch (error) {
    console.error('getTeamById error:', error);
    throw error;
  }
};

// Upload team files (photo and/or file). Accepts a FormData instance or builds one from files
export const uploadTeamFiles = async (teamId, formData) => {
  try {
    const res = await fetch(`${API_BASE}/teams/${teamId}/upload`, {
      method: 'POST',
      headers: {
        // don't set Content-Type for multipart; include auth header if present
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: formData
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `${res.status} ${res.statusText}` || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('uploadTeamFiles error:', error);
    throw error;
  }
};

// Update team (members only)
export const updateTeam = async (teamId, updates) => {
  try {
    const res = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Failed to update team');
    }

    return data;
  } catch (error) {
    console.error('updateTeam error:', error);
    throw error;
  }
};

// Leave team (member)
export const leaveTeam = async (teamId) => {
  try {
    const res = await fetch(`${API_BASE}/teams/${teamId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to leave team');
    }

    return await res.json();
  } catch (error) {
    console.error('leaveTeam error:', error);
    throw error;
  }
};

// Delete team (leader or admin)
export const deleteTeam = async (teamId) => {
  try {
    const res = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete team');
    }

    return await res.json();
  } catch (error) {
    console.error('deleteTeam error:', error);
    throw error;
  }
};