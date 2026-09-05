import type { SectionVideoResponse, VideoBudgetStatus } from '../types/video';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function generateSectionVideo(
  sectionId: string,
  onScreenHeadline: string
): Promise<SectionVideoResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/video/section`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      sectionId,
      onScreenHeadline,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Video generation failed with status ${response.status}`;
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

export async function getVideoBudget(): Promise<VideoBudgetStatus> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/video/budget`, {
    headers: {
      ...authHeader,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch avatar video budget status');
  }
  return await response.json();
}
