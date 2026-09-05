import { getAuthHeader } from '../lib/authHeader';
import type { LessonPlan } from '../types/lessonPlan';
import type { SectionContent } from '../types/sectionContent';
import type {
  CheckpointRecordRequest,
  ReportContent,
  ProfileResponse,
} from '../types/session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function getHeaders(): Promise<Record<string, string>> {
  const authHeader = await getAuthHeader();
  return {
    'Content-Type': 'application/json',
    ...authHeader,
  };
}

export async function getSessionPlan(
  sessionId: string
): Promise<LessonPlan> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/plan`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to fetch session plan');
  }

  return res.json();
}

export async function getSessionContent(
  sessionId: string
): Promise<{ sections: SectionContent[] } | null> {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/content`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to fetch session content');
  }

  return res.json();
}

export async function recordCheckpoint(
  sessionId: string,
  payload: CheckpointRecordRequest
): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/sessions/${sessionId}/checkpoint`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to record checkpoint');
  }
}

export async function completeSession(
  sessionId: string
): Promise<ReportContent> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/sessions/${sessionId}/complete`,
    {
      method: 'POST',
      headers,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to complete session and generate report');
  }

  return res.json();
}

export async function getSessionReport(
  sessionId: string
): Promise<ReportContent> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/sessions/${sessionId}/report`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to fetch session report');
  }

  return res.json();
}

export async function getLearnerProfile(): Promise<ProfileResponse> {
  const headers = await getHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/learners/me/profile`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to fetch learner profile');
  }

  return res.json();
}
