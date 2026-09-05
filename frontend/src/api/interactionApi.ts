import type {
  CheckpointQuestion,
  EvaluationResult,
  RemediationContent,
} from '../types/interaction';
import { getAuthHeader } from '../lib/authHeader';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchCheckpoint(
  section: any,
  content: any
): Promise<CheckpointQuestion> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/interaction/checkpoint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ section, content }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate checkpoint question: ${errText}`);
  }

  return await response.json();
}

export async function evaluateStudentAnswer(
  question: CheckpointQuestion,
  studentAnswer: string
): Promise<EvaluationResult> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/interaction/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ question, studentAnswer }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to evaluate student answer: ${errText}`);
  }

  return await response.json();
}

export async function fetchRemediation(
  question: CheckpointQuestion,
  studentAnswer: string,
  evaluation: EvaluationResult
): Promise<RemediationContent> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/interaction/remediate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ question, studentAnswer, evaluation }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate adaptive remediation: ${errText}`);
  }

  return await response.json();
}

export async function transcribeAudioBlob(fileBlob: Blob): Promise<string> {
  const authHeader = await getAuthHeader();
  const formData = new FormData();
  formData.append('file', fileBlob, 'voice_recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/interaction/transcribe`, {
    method: 'POST',
    headers: {
      ...authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to transcribe voice recording: ${errText}`);
  }

  const data = await response.json();
  return data.text;
}
