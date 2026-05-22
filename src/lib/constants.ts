// ── Text limits ────────────────────────────────────────────────────────────────
export const MAX_NOTE_TITLE_LENGTH = 50;
export const MAX_PROJECT_NAME_LENGTH = 50;

export const MAX_DESCRIPTION_LENGTH = 25000;
export const MAX_NOTE_ATTACHMENTS_SIZE = 2 * 1024 * 1024; // 2MB

// ── Default values ─────────────────────────────────────────────────────────────
export const DEFAULT_NOTE_COLOR = '#fab005';
export const DEFAULT_PROJECT_COLOR = '#495057';

export const DEFAULT_MENU_COLORS = ['#fab005', '#ffadad', '#fdffb6', '#caffbf'];

// ── Regex ──────────────────────────────────────────────────────────────────────
export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
	APP: '/app',
	PROJECT: (id: string): `/app/project/${string}` => `/app/project/${id}`
} as const;

// ── Database ─────────────────────────────────────────────────────────────────
export const DB_VERSION = 2;
