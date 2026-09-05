import type { LessonPlan } from '../types/lessonPlan';
import type { SourceConfig } from '../types/lessonRequest';
import type { ContentGenerationResponse } from '../types/sectionContent';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function generateContent(
  plan: LessonPlan,
  source: SourceConfig,
  sessionId?: string,
): Promise<ContentGenerationResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/lessons/generate-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      plan,
      source,
      sessionId,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Content generation failed with status ${response.status}`;
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
