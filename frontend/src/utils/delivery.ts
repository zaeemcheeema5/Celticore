// Shared delivery helpers for the checkout, My Orders and the admin screens.
// The validation here MUST stay in step with backend/utils/delivery.js — the
// server re-checks everything, this only gives instant feedback.

export const IRISH_COUNTIES: string[] = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
];

// Eircode = 3-character routing key (letter + 2 digits, or the special D6W)
// followed by a 4-character unique identifier. Only the letters
// A C D E F H K N P R T V W X Y are ever used. This checks the structure
// only — it cannot prove the address exists.
const EIRCODE_REGEX = /^(?:[AC-FHKNPRTV-Y]\d{2}|D6W)[0-9AC-FHKNPRTV-Y]{4}$/;

export function normaliseEircode(value: string): string {
  return (value || '').replace(/\s+/g, '').toUpperCase();
}

export function formatEircode(value: string): string {
  const compact = normaliseEircode(value);
  return compact.length === 7 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
}

export function validateEircode(value: string): string | undefined {
  const raw = (value || '').trim();
  if (!raw) return 'Eircode is required.';
  if (/^BT\s?\d/i.test(raw)) {
    return 'Northern Ireland (BT) postcodes are not supported yet — Republic of Ireland only.';
  }
  if (!EIRCODE_REGEX.test(normaliseEircode(raw))) return 'Enter a valid Eircode (e.g. D02 X285).';
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const v = (value || '').trim();
  if (!v) return 'Phone number is required.';
  const digits = v.replace(/\D/g, '');
  if (!/^\+?[0-9][0-9 ()-]{5,24}$/.test(v) || digits.length < 7 || digits.length > 15) {
    return 'Enter a valid phone number.';
  }
  return undefined;
}

// "2–4 working days" / "1 working day" / '' when nothing is configured.
export function formatEstimate(min?: number | null, max?: number | null): string {
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= 0) return '';
  if (lo === hi) return `${hi} working day${hi === 1 ? '' : 's'}`;
  return `${lo}–${hi} working days`;
}

// MySQL returns "2026-07-19 10:00:00". Safari can't parse the space, so
// swap it for a "T" first.
export function parseDbDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDbDate(value?: string | null): string {
  const d = parseDbDate(value);
  return d ? d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export const euro = (n: number | string | undefined | null): string =>
  `€${(Number(n) || 0).toFixed(2)}`;

// Only ever render http(s) links coming from the database.
export function safeHttpUrl(value?: string | null): string {
  return /^https?:\/\//i.test(String(value || '')) ? String(value) : '';
}

// Estimate wording for an order: the exact text configured by the business
// (e.g. "Next working day (99% of parcels)…") or, if none, "2–4 working days".
export function estimateLabel(text?: string | null, min?: number | null, max?: number | null): string {
  return (text && text.trim()) || formatEstimate(min, max);
}