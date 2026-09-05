import type { SectionAudioResponse, BudgetStatus } from '../types/audio';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function generateSectionAudio(
  sectionId: string,
  beats: string[],
  language?: string
): Promise<SectionAudioResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/audio/section`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      sectionId,
      beats,
      language: language || 'English',
    }),
  });

  if (!response.ok) {
    let errorMessage = `Audio generation failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = await response.text();
    }
    const err: any = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  return await response.json();
}

export async function getBudget(): Promise<BudgetStatus> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/audio/budget`, {
    headers: {
      ...authHeader,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch character budget status');
  }
  return await response.json();
}
