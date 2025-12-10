// Test data management for captured events and session data
import * as vscode from 'vscode';
import { TestEvent, SessionData } from './types';

export class TestDataManager {
  private sessions: Map<string, SessionData> = new Map();
  private currentSessionId: string | null = null;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadPersistedData();
  }
  public importSessionData(data: any): string {
    console.log('TestDataManager.importSessionData called');
    const sessionId = data.id || `imported_${Date.now()}`;
    
    const session: SessionData = {
      id: sessionId,
      startTime: data.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString(),
      events: data.events || [],
      testData: {},
      framework: data.framework || 'playwright'
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    this.extractTestDataFromEvents(session);
    this.persistData();
    
    return sessionId;
  }

  public startSession(sessionId: string): void {
    console.log('TestDataManager.startSession called for:', sessionId);
    const session: SessionData = {
      id: sessionId,
      startTime: new Date().toISOString(),
      events: [],
      testData: {},
      framework: 'selenium' // Default framework
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    console.log('Session created and set as current. Total sessions:', this.sessions.size);
    this.persistData();
  }
  public endSession(sessionId: string): void {
    console.log('TestDataManager.endSession called for:', sessionId);
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      console.log('Session ended, events count:', session.events.length);
      this.extractTestDataFromEvents(session);
      this.persistData();
    } else {
      console.warn('Session not found when trying to end:', sessionId);
    }
  }
  public addEvent(event: TestEvent): void {
    console.log('TestDataManager.addEvent called:', event);
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.events.push(event);
        console.log('Event added to session', this.currentSessionId, 'Total events:', session.events.length);
        this.persistData();
      } else {
        console.warn('Session not found for currentSessionId:', this.currentSessionId);
      }
    } else {
      console.warn('No current session ID when trying to add event');
    }
  }

  public getCurrentSession(): SessionData | null {
    if (this.currentSessionId) {
      return this.sessions.get(this.currentSessionId) || null;
    }
    return null;
  }
  public getSession(sessionId: string): SessionData | null {
    console.log('TestDataManager.getSession called for:', sessionId);
    console.log('Available sessions:', Array.from(this.sessions.keys()));
    const session = this.sessions.get(sessionId) || null;
    console.log('Session found:', session ? 'Yes' : 'No');
    return session;
  }
  public getAllSessions(): SessionData[] {
    const sessions = Array.from(this.sessions.values());
    console.log('TestDataManager.getAllSessions called. Count:', sessions.length);
    sessions.forEach(session => {
      console.log(`Session ${session.id}: ${session.events.length} events, ended: ${!!session.endTime}`);
    });
    return sessions;
  }

  public getMostRecentSession(): SessionData | null {
    const sessions = this.getAllSessions();
    if (sessions.length === 0) return null;
    
    // Sort by start time, return the most recent
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return sessions[0];
  }

  public updateSessionConfig(sessionId: string, config: Partial<SessionData>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, config);
      this.persistData();
    }
  }

  public updateTestData(sessionId: string, testData: { [key: string]: any }): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.testData = { ...session.testData, ...testData };
      this.persistData();
    }
  }

  public removeEvent(sessionId: string, eventIndex: number): void {
    const session = this.sessions.get(sessionId);
    if (session && eventIndex >= 0 && eventIndex < session.events.length) {
      session.events.splice(eventIndex, 1);
      this.persistData();
    }
  }

  public reorderEvents(sessionId: string, fromIndex: number, toIndex: number): void {
    const session = this.sessions.get(sessionId);
    if (session && fromIndex >= 0 && toIndex >= 0 && 
        fromIndex < session.events.length && toIndex < session.events.length) {
      const [movedEvent] = session.events.splice(fromIndex, 1);
      session.events.splice(toIndex, 0, movedEvent);
      this.persistData();
    }
  }

  private extractTestDataFromEvents(session: SessionData): void {
    const testData: { [key: string]: any } = {};

    session.events.forEach((event, index) => {
      const eventType = event.event || event.type;
      
      // Extract input values
      // Check inputValue (top level) or element.value
      const value = event.inputValue || (event.element && event.element.value);
      
      if ((eventType === 'change' || eventType === 'input') && value) {
        const fieldName = this.generateFieldName(event.element);
        if (fieldName) {
          testData[fieldName] = value;
        }
      }

      // Extract button text - Only for actual buttons/links
      if (eventType === 'click' && event.element && event.element.text) {
        const tag = event.element.tag ? event.element.tag.toLowerCase() : '';
        const type = event.element.type ? event.element.type.toLowerCase() : '';
        
        if (tag === 'button' || tag === 'a' || (tag === 'input' && (type === 'submit' || type === 'button'))) {
          const buttonKey = `button_${index}_text`;
          testData[buttonKey] = event.element.text.trim();
        }
      }

      // Extract URLs for navigation
      if (eventType === 'navigation' && event.page) {
        const urlKey = `navigation_${index}_url`;
        testData[urlKey] = event.page.url;
      }
    });

    session.testData = { ...session.testData, ...testData };
  }

  private generateFieldName(element: any): string | null {
    if (!element) return null;
    
    // Priority order for field names
    // 1. data-testid or testid (Strongest contract)
    if (element['data-testid']) return element['data-testid'];
    if (element.testid) return element.testid;
    
    // 2. ID (Standard unique identifier)
    if (element.id) return element.id;
    
    // 3. Name (Form field identifier)
    if (element.name) return element.name;
    
    // 4. Placeholder (User visible label fallback)
    if (element.placeholder) return element.placeholder.toLowerCase().replace(/\s+/g, '_');
    
    return null;
  }

  private persistData(): void {
    try {
      const sessionsData = JSON.stringify(Array.from(this.sessions.entries()));
      this.context.globalState.update('testcaptive.sessions', sessionsData);
    } catch (error) {
      console.error('Failed to persist session data:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      const sessionsData = this.context.globalState.get<string>('testcaptive.sessions');
      if (sessionsData) {
        const entries = JSON.parse(sessionsData);
        this.sessions = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load persisted session data:', error);
    }
  }

  public clearAllSessions(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    this.persistData();
  }

  public exportSessionData(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return JSON.stringify(session.testData, null, 2);
  }
}
