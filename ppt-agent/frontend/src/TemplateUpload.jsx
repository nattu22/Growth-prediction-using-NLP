import React, { useState } from 'react';
import axios from 'axios';

const TemplateUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // In production, configure URL
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/upload-template`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(response.data.template_id);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload template");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="template-upload">
      <h3>Optional: Upload Background Template</h3>
      <input type="file" onChange={handleFileChange} disabled={uploading} accept="image/*" />
      {uploading && <span>Uploading...</span>}
    </div>
  );
};

export default TemplateUpload;
