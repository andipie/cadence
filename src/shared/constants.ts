import type { TopicDirection, TopicPriority, TopicStatus, Language } from './types';

export const APP_NAME = 'Cadence';

export const MIN_WINDOW_WIDTH = 960;
export const MIN_WINDOW_HEIGHT = 600;
export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 800;

export const SIDEBAR_WIDTH = 240;
export const DETAIL_PANEL_WIDTH = 380;

export const MIN_SIDEBAR_WIDTH = 160;
export const MAX_SIDEBAR_WIDTH = 400;
export const MIN_DETAIL_PANEL_WIDTH = 280;
export const MAX_DETAIL_PANEL_WIDTH = 600;
export const MIN_MIDDLE_PANEL_WIDTH = 300;

export const DEFAULT_STATUS: TopicStatus = 'new';
export const DEFAULT_PRIORITY: TopicPriority = 'normal';
export const DEFAULT_DIRECTION: TopicDirection = 'discuss';

export const UNDO_TOAST_DURATION_MS = 5000;
export const WARN_WAITING_DAYS_DEFAULT = 7;
export const WARN_WAITING_CRITICAL_DEFAULT = 14;

export const CAPTURE_WINDOW_WIDTH = 400;
export const CAPTURE_WINDOW_HEIGHT = 160;
export const DEFAULT_CAPTURE_HOTKEY = 'CommandOrControl+Shift+T';

export const DEFAULT_LANGUAGE: Language = 'en';
