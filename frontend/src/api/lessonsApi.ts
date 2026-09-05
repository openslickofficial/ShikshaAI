import type { LessonRequest } from '../types/lessonRequest';
import type { PlanGenerationResponse } from '../types/lessonPlan';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchLessonPlan(request: LessonRequest): Promise<PlanGenerationResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/lessons/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `API Error ${response.status}`;
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
