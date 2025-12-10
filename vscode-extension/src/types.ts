export interface TestEvent {
  event?: string;
  type?: string;
  timestamp: string;
  element: {
    tag: string;
    text?: string;
    id?: string;
    class?: string;
    'data-testid'?: string;
    xpath?: string;
    cssSelector?: string;
    name?: string;
    type?: string;
    placeholder?: string;
    testid?: string;
    ariaLabel?: string;
    role?: string;
    value?: string;
  };
  page: {
    url: string;
    title: string;
  };
  value?: string;
  inputValue?: string;
  sessionId: string;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  events: TestEvent[];
  testData: { [key: string]: any };
  framework: 'selenium' | 'playwright' | 'cypress';
  userRole?: string;
  applicationUrl?: string;
}
