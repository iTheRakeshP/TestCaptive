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
  | 'new-tab';

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
