// Chrome Extension Shared Types

export interface ElementInfo {
  tag: string;
  id: string;
  className: string;
  text: string;
  value: string;
  type: string;
  name: string;
  placeholder: string;
  testid: string;
  ariaLabel: string;
  role: string;
  xpath: string;
  cssSelector?: string;
  'data-testid'?: string;
  checked?: boolean;
  selectedOptions?: string[];
  href?: string;
  src?: string;
  isContentEditable?: boolean;
  /**
   * Selector confidence score (0–100).
   * 100 = data-testid, 90 = aria-label, 80 = stable id, 70 = name,
   * 50 = role+text / stable class, 30 = xpath fallback, 10 = nth-child fallback.
   * Anything < 60 should be flagged in the UI for user review before running tests.
   */
  selectorConfidence?: number;
  /** Which selector tier was used (for diagnostics & UI surfacing). */
  selectorTier?: 'testid' | 'aria-label' | 'id' | 'name' | 'role-text' | 'class' | 'xpath' | 'nth-child';
}

export interface PageInfo {
  url: string;
  title: string;
  scrollX?: number;
  scrollY?: number;
}

export interface PositionInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClickPosition {
  clientX: number;
  clientY: number;
}

export interface FileData {
  name: string;
  size: number;
  type: string;
}

export interface AssertionData {
  type: string;
  description: string;
  expectedValue?: string;
  attributeName?: string;
  timestamp: string;
  element?: ElementInfo;
}

export type RecordedEventType =
  | 'navigation'
  | 'click'
  | 'dblclick'
  | 'fill'
  | 'check'
  | 'input'
  | 'change'
  | 'keydown'
  | 'select'
  | 'submit'
  | 'scroll'
  | 'file-upload'
  | 'dialog'
  | 'assertion'
  | 'spa-navigation'
  | 'drag-drop'
  | 'hover'
  | 'new-tab'
  // ===== Robustness / evidence event types (v1.3) =====
  | 'network'           // captured XHR/fetch request+response summary
  | 'console'           // captured console.log/warn/error from the page
  | 'page-error'        // uncaught JS exception in the page
  | 'wait-hint'         // implicit wait inferred from time gap or network idle
  | 'storage-snapshot'; // localStorage / sessionStorage / cookies at recording start

export interface NetworkEventData {
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  responseContentType?: string;
  responseBodyPreview?: string;  // truncated, redacted
  initiator?: 'fetch' | 'xhr';
  ok?: boolean;
}

export interface ConsoleEventData {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  url?: string;
}

export interface PageErrorData {
  message: string;
  stack?: string;
  url?: string;
  lineno?: number;
  colno?: number;
}

export interface WaitHintData {
  /** Reason the wait was inferred. */
  reason: 'time-gap' | 'network-idle' | 'url-change' | 'manual';
  /** Milliseconds the user paused before the next action. */
  durationMs: number;
  /** Optional URL or selector context. */
  context?: string;
}

export interface StorageSnapshotData {
  url: string;
  origin: string;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string; path?: string }>;
}

export interface RecordedEvent {
  type: RecordedEventType | string;
  timestamp: string;
  element: ElementInfo;
  page: PageInfo;
  sessionId: string;
  selector?: string;
  inputValue?: string;
  value?: string;
  clickPosition?: ClickPosition;
  assertion?: AssertionData;
  position?: PositionInfo;
  files?: FileData[];
  dialogType?: string;
  dialogMessage?: string;
  dialogResponse?: string;
  dragSource?: string;
  dropTarget?: string;
  scrollPosition?: { x: number; y: number };
  iframeContext?: string;
  frameInfo?: FrameInfo;
  triggersNavigation?: boolean;
  tabId?: number;
  windowId?: number;
  // ===== v1.3 evidence payloads =====
  network?: NetworkEventData;
  console?: ConsoleEventData;
  pageError?: PageErrorData;
  waitHint?: WaitHintData;
  storageSnapshot?: StorageSnapshotData;
}

export interface FrameInfo {
  frameUrl: string;
  frameId?: string;
  frameName?: string;
  frameIndex?: number;
  isCrossOrigin?: boolean;
}

export interface SessionData {
  id: string;
  timestamp: string;
  events: RecordedEvent[];
  framework: 'playwright';
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  browserName?: string;
  browserVersion?: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  platform?: string;
  language?: string;
  startUrl?: string;
}

export interface StatusResponse {
  isRecording: boolean;
  eventCount: number;
  sessionId: string | null;
  success?: boolean;
  message?: string;
}
