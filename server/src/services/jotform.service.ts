import { env } from "../config/env.js";
import {
  type JotformSubmissionResponse,
  type RawJotformSubmission,
} from "../types/investigation.js";

const JOTFORM_BASE_URL = "https://api.jotform.com";

const fetchWithApiKey = async (formId: string, apiKey: string) => {
  const url = new URL(`/form/${formId}/submissions`, JOTFORM_BASE_URL);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("limit", "1000");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as JotformSubmissionResponse;

  if (body.responseCode !== 200) {
    throw new Error(body.message || "Jotform request failed");
  }

  return body.content ?? [];
};

export const fetchFormSubmissions = async (formId: string) => {
  let lastError: unknown;

  for (const apiKey of env.apiKeys) {
    try {
      return await fetchWithApiKey(formId, apiKey);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to fetch Jotform submissions for form ${formId}`);
};

export const fetchAllFormSubmissions = async (): Promise<{
  checkins: RawJotformSubmission[];
  messages: RawJotformSubmission[];
  sightings: RawJotformSubmission[];
  notes: RawJotformSubmission[];
  tips: RawJotformSubmission[];
}> => {
  const [checkins, messages, sightings, notes, tips] = await Promise.all([
    fetchFormSubmissions(env.forms.checkins),
    fetchFormSubmissions(env.forms.messages),
    fetchFormSubmissions(env.forms.sightings),
    fetchFormSubmissions(env.forms.notes),
    fetchFormSubmissions(env.forms.tips),
  ]);

  return {
    checkins,
    messages,
    sightings,
    notes,
    tips,
  };
};
