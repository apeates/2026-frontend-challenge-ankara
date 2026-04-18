import dotenv from "dotenv";

dotenv.config();

const readRequired = (name: string, fallbackName?: string) => {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const readOptional = (name: string, fallbackName?: string) =>
  process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

const apiKeys = [
  readOptional("JOTFORM_API_KEY_1", "VITE_JOTFORM_API_KEY_1"),
  readOptional("JOTFORM_API_KEY_2", "VITE_JOTFORM_API_KEY_2"),
  readOptional("JOTFORM_API_KEY_3", "VITE_JOTFORM_API_KEY_3"),
].filter((value): value is string => Boolean(value));

if (apiKeys.length === 0) {
  throw new Error("At least one Jotform API key must be configured.");
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  apiKeys,
  forms: {
    checkins: readRequired("FORM_CHECKINS", "VITE_FORM_CHECKINS"),
    messages: readRequired("FORM_MESSAGES", "VITE_FORM_MESSAGES"),
    sightings: readRequired("FORM_SIGHTINGS", "VITE_FORM_SIGHTINGS"),
    notes: readRequired("FORM_NOTES", "VITE_FORM_NOTES"),
    tips: readRequired("FORM_TIPS", "VITE_FORM_TIPS"),
  },
};
