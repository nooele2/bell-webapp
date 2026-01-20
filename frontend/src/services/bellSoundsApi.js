const API_URL = 'http://localhost:5001/api';

export const getBellSounds = async () => {
  const response = await fetch(`${API_URL}/bell-sounds`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch bell sounds');
  }
  
  return response.json();
};

export const uploadBellSound = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/bell-sounds`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload bell sound');
  }
  
  return response.json();
};

export const getBellSoundUrl = (soundId) => {
  return `${API_URL}/bell-sounds/${soundId}`;
};

export const updateBellSound = async (soundId, data) => {
  const response = await fetch(`${API_URL}/bell-sounds/${soundId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update bell sound');
  }
  
  return response.json();
};

export const deleteBellSound = async (soundId) => {
  const response = await fetch(`${API_URL}/bell-sounds/${soundId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete bell sound');
  }
  
  return response.json();
};