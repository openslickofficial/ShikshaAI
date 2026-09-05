import type { MaterialUploadResponse } from '../types/material';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadMaterial(file: File): Promise<MaterialUploadResponse> {
  const authHeader = await getAuthHeader();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/materials/upload`, {
    method: 'POST',
    headers: {
      ...authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
