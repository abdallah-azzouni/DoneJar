// ── Text limits ────────────────────────────────────────────────────────────────
export const MAX_NOTE_TITLE_LENGTH = 50;
export const MAX_PROJECT_NAME_LENGTH = 50;

// ── Regex ──────────────────────────────────────────────────────────────────────
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
	APP: '/app',
	PROJECT: (id: string): `/app/project/${string}` => `/app/project/${id}`
} as const;
