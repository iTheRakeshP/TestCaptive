export type AssertionType =
  | 'text-equals'
  | 'text-contains'
  | 'visible'
  | 'not-visible'
  | 'enabled'
  | 'disabled'
  | 'url-contains'
  | 'url-equals'
  | 'attribute-equals'
  | 'count-equals';

export type RecordedEventType =
  | 'click'
  | 'dblclick'
  | 'fill'
  | 'check'
  | 'input'
  | 'change'
  | 'keydown'
  | 'select'
  | 'scroll'
  | 'hover'
  | 'navigation'
  | 'spa-navigation'
  | 'file-upload'
  | 'drag-drop'
  | 'dialog'
  | 'submit'
  | 'new-tab'
  | 'assertion'
  // v1.3 evidence + flow types
  | 'network'
  | 'console'
  | 'page-error'
  | 'wait-hint'
  | 'storage-snapshot';

export interface ElementInfo {
  tag: string;
  text?: string;
  id?: string;
  class?: string;
  testid?: string;
  ariaLabel?: string;
  role?: string;
  xpath?: string;
  cssSelector?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
}

export interface Assertion {
  type: AssertionType;
  description: string;
  expectedValue?: string;
  attributeName?: string;
  timestamp: string;
  element?: ElementInfo;
}

export interface TestEvent {
  event: RecordedEventType;
  timestamp: string;
  element: ElementInfo;
  page: {
    url: string;
    title: string;
  };
  value?: string;
  inputValue?: string;
  sessionId: string;
  assertion?: Assertion;
  // SPA navigation
  fromUrl?: string;
  toUrl?: string;
  // Dialog
  dialogType?: 'alert' | 'confirm' | 'prompt';
  dialogMessage?: string;
  // Drag-drop
  dropTarget?: ElementInfo;
  // File upload
  fileName?: string;
  // Scroll
  scrollX?: number;
  scrollY?: number;
}

export interface SessionMetadata {
  userAgent?: string;
  platform?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  events: TestEvent[];
  assertions?: Assertion[];
  testData: { [key: string]: any };
  framework: 'playwright';
  userRole?: string;
  applicationUrl?: string;
  metadata?: SessionMetadata;
}
