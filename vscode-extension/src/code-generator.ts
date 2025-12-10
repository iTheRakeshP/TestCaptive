// Code generator for test scripts
import * as fs from 'fs';
import * as path from 'path';
import { TestEvent, SessionData } from './types';

export interface TemplateEngine {
  compile(template: string, data: any): string;
}

// Simple template engine implementation
class SimpleTemplateEngine implements TemplateEngine {
  compile(template: string, data: any): string {
    let result = template;

    // Handle {{#events}} loops
    const eventsMatch = result.match(/{{#events}}([\s\S]*?){{\/events}}/);
    if (eventsMatch && data.events) {
      // Remove leading newline and trailing whitespace from the template to avoid blank lines
      const eventTemplate = eventsMatch[1].replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');
      const generatedEvents: string[] = [];
      let navigationCount = 0;

      // Filter out redundant input events (debounce on the generator side)
      const processedEvents: TestEvent[] = [];
      if (data.events && Array.isArray(data.events)) {
        for (let i = 0; i < data.events.length; i++) {
          const currentEvent = data.events[i];
          const nextEvent = i < data.events.length - 1 ? data.events[i + 1] : null;
          
          const currentType = currentEvent.event || currentEvent.type;
          
          if (currentType === 'input' && nextEvent) {
              const nextType = nextEvent.event || nextEvent.type;
              // Use selector or xpath to identify the element
              const currentSelector = currentEvent.selector || (currentEvent.element && currentEvent.element.xpath) || (currentEvent.element && currentEvent.element.id);
              const nextSelector = nextEvent.selector || (nextEvent.element && nextEvent.element.xpath) || (nextEvent.element && nextEvent.element.id);
              
              if (nextType === 'input' && currentSelector && nextSelector && currentSelector === nextSelector) {
                  continue; // Skip this event as it's an intermediate input
              }
          }
          processedEvents.push(currentEvent);
        }
      }

      processedEvents.forEach((event: TestEvent, index: number) => {
        let eventCode = eventTemplate;
        const eventType = event.event || event.type || '';
        const eventValue = event.inputValue || event.value || (event.element && event.element.value) || '';
        
        if (eventType === 'navigation') {
            navigationCount++;
            (event as any).isFirstNavigation = (navigationCount === 1);
        }

        // Replace event-specific variables
        eventCode = eventCode.replace(/{{event}}/g, eventType);
        eventCode = eventCode.replace(/{{timestamp}}/g, event.timestamp);
        eventCode = eventCode.replace(/{{sessionId}}/g, event.sessionId);
        eventCode = eventCode.replace(/{{value}}/g, eventValue);
        
        // Replace page variables
        if (event.page) {
          eventCode = eventCode.replace(/{{page\.url}}/g, event.page.url || '');
          eventCode = eventCode.replace(/{{page\.title}}/g, event.page.title || '');
        }
        
        // Replace element variables
        if (event.element) {
          Object.keys(event.element).forEach(key => {
            const value = (event.element as any)[key];
            if (value) {
              eventCode = eventCode.replace(new RegExp(`{{element\\.${key}}}`, 'g'), value);
            }
          });
        }
        
        // Handle conditional statements
        eventCode = this.handleConditionals(eventCode, event);
        
        // Only add if the code is not empty (after conditional processing)
        if (eventCode.trim()) {
            generatedEvents.push(eventCode);
        }
      });

      result = result.replace(/{{#events}}[\s\S]*?{{\/events}}/g, generatedEvents.join('\n'));
    }

    // Replace simple variables
    Object.keys(data).forEach(key => {
      if (key !== 'events') {
        const value = data[key];
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    });

    return result;
  }

  private handleConditionals(template: string, event: TestEvent): string {
    let result = template;
    const eventType = event.event || event.type;
    const eventValue = event.inputValue || event.value || (event.element && event.element.value) || '';

    // Handle Field Name Generation Chain (Specific for data key generation)
    // {{#if element.testid}}...{{else if element.id}}...{{else if element.name}}...{{else}}...{{/if}}
    // Must run first to ensure nested conditionals in {{#if value}} are resolved
    const fieldNameChainMatches = result.matchAll(/{{#if\s+element\.testid}}([\s\S]*?){{else\s+if\s+element\.id}}([\s\S]*?){{else\s+if\s+element\.name}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of fieldNameChainMatches) {
      const [fullMatch, contentTestId, contentId, contentName, contentElse] = match;
      if (event.element && event.element.testid) {
        result = result.replace(fullMatch, contentTestId);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle element selector priority chain (Big Chain - Playwright)
    // {{#if element.testid}}...{{else if element.ariaLabel}}...{{else if element.id}}...{{else if element.name}}...{{else if element.xpath}}...{{else}}...{{/if}}
    // Must run before {{#if value}} because this chain is used INSIDE {{#if value}} blocks
    const selectorChainMatches = result.matchAll(/{{#if\s+element\.testid}}([\s\S]*?){{else\s+if\s+element\.ariaLabel}}([\s\S]*?){{else\s+if\s+element\.id}}([\s\S]*?){{else\s+if\s+element\.name}}([\s\S]*?){{else\s+if\s+element\.xpath}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of selectorChainMatches) {
      const [fullMatch, contentTestId, contentAria, contentId, contentName, contentXpath, contentElse] = match;
      if (event.element && event.element.testid) {
        result = result.replace(fullMatch, contentTestId);
      } else if (event.element && event.element.ariaLabel) {
        result = result.replace(fullMatch, contentAria);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else if (event.element && event.element.xpath) {
        result = result.replace(fullMatch, contentXpath);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle Playwright Keydown Chain (TestID -> Aria -> ID -> Name -> Else) - Fallback for older templates or missing xpath
    const playwrightKeydownChainMatches = result.matchAll(/{{#if\s+element\.testid}}([\s\S]*?){{else\s+if\s+element\.ariaLabel}}([\s\S]*?){{else\s+if\s+element\.id}}([\s\S]*?){{else\s+if\s+element\.name}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of playwrightKeydownChainMatches) {
      const [fullMatch, contentTestId, contentAria, contentId, contentName, contentElse] = match;
      if (event.element && event.element.testid) {
        result = result.replace(fullMatch, contentTestId);
      } else if (event.element && event.element.ariaLabel) {
        result = result.replace(fullMatch, contentAria);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle element selector priority chain (Medium Chain - Cypress)
    // {{#if element.testid}}...{{else if element.id}}...{{else if element.name}}...{{else if element.xpath}}...{{else}}...{{/if}}
    const selectorChainNoAriaMatches = result.matchAll(/{{#if\s+element\.testid}}([\s\S]*?){{else\s+if\s+element\.id}}([\s\S]*?){{else\s+if\s+element\.name}}([\s\S]*?){{else\s+if\s+element\.xpath}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of selectorChainNoAriaMatches) {
      const [fullMatch, contentTestId, contentId, contentName, contentXpath, contentElse] = match;
      if (event.element && event.element.testid) {
        result = result.replace(fullMatch, contentTestId);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else if (event.element && event.element.xpath) {
        result = result.replace(fullMatch, contentXpath);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle element selector priority chain (Selenium Chain)
    // {{#if element.testid}}...{{else if element.id}}...{{else if element.name}}...{{else}}...{{/if}}
    const seleniumChainMatches = result.matchAll(/{{#if\s+element\.testid}}([\s\S]*?){{else\s+if\s+element\.id}}([\s\S]*?){{else\s+if\s+element\.name}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of seleniumChainMatches) {
      const [fullMatch, contentTestId, contentId, contentName, contentElse] = match;
      if (event.element && event.element.testid) {
        result = result.replace(fullMatch, contentTestId);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle {{#if isFirstNavigation}}

    // Handle element name/id chain (Small Chain)
    // {{#if element.name}}...{{else if element.id}}...{{else}}...{{/if}}
    const nameIdChainMatches = result.matchAll(/{{#if element\.name}}([\s\S]*?){{else if element\.id}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of nameIdChainMatches) {
      const [fullMatch, contentName, contentId, contentElse] = match;
      if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle element id/name chain (Selenium Keydown Chain)
    // {{#if element.id}}...{{else if element.name}}...{{else}}...{{/if}}
    const idNameChainMatches = result.matchAll(/{{#if element\.id}}([\s\S]*?){{else if element\.name}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);

    for (const match of idNameChainMatches) {
      const [fullMatch, contentId, contentName, contentElse] = match;
      if (event.element && event.element.id) {
        result = result.replace(fullMatch, contentId);
      } else if (event.element && event.element.name) {
        result = result.replace(fullMatch, contentName);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle element text check
    // {{#if element.text}}...{{else}}...{{/if}}
    const textMatches = result.matchAll(/{{#if element\.text}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);
    for (const match of textMatches) {
        const [fullMatch, contentIf, contentElse] = match;
        if (event.element && event.element.text) {
            result = result.replace(fullMatch, contentIf);
        } else {
            result = result.replace(fullMatch, contentElse);
        }
    }

    // Handle {{#if value}} (Check if value exists/is not empty)
    const valueIfMatches = result.matchAll(/{{#if value}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);
    for (const match of valueIfMatches) {
      const [fullMatch, contentIf, contentElse] = match;
      if (eventValue) {
        result = result.replace(fullMatch, contentIf);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle {{#if (eq value '...')}} - Specific for Keydown events (Enter, Tab, Escape)
    // Matches: if (Enter) ... else if (Tab) ... else if (Escape) ... else ...
    const valueEqMatches = result.matchAll(/{{#if\s+\(eq\s+value\s+'([^']+)'\)\}}([\s\S]*?){{else\s+if\s+\(eq\s+value\s+'([^']+)'\)\}}([\s\S]*?){{else\s+if\s+\(eq\s+value\s+'([^']+)'\)\}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);
    for (const match of valueEqMatches) {
        const [fullMatch, val1, content1, val2, content2, val3, content3, contentElse] = match;
        if (eventValue === val1) {
            result = result.replace(fullMatch, content1);
        } else if (eventValue === val2) {
            result = result.replace(fullMatch, content2);
        } else if (eventValue === val3) {
            result = result.replace(fullMatch, content3);
        } else {
            result = result.replace(fullMatch, contentElse);
        }
    }

    // Handle {{#if (eq event 'value')}} conditions
    // Pattern 1: Navigation -> Click -> Change/Input -> Keydown (No final else)
    const mainLoopMatches = result.matchAll(/{{#if \(eq event '([^']+)'\)}}([\s\S]*?){{else if \(eq event '([^']+)'\)}}([\s\S]*?){{else if \(or \(eq event '([^']+)'\) \(eq event '([^']+)'\)\)}}([\s\S]*?){{else if \(eq event '([^']+)'\)}}([\s\S]*?){{\/if}}/g);
    
    for (const match of mainLoopMatches) {
      const [fullMatch, cond1, content1, cond2, content2, cond3a, cond3b, content3, cond4, content4] = match;
      
      if (eventType === cond1) {
        result = result.replace(fullMatch, content1);
      } else if (eventType === cond2) {
        result = result.replace(fullMatch, content2);
      } else if (eventType === cond3a || eventType === cond3b) {
        result = result.replace(fullMatch, content3);
      } else if (eventType === cond4) {
        result = result.replace(fullMatch, content4);
      } else {
        result = result.replace(fullMatch, '');
      }
    }

    // Pattern 2: Navigation -> Click -> Change/Input -> Else (Legacy/Fallback)
    const legacyLoopMatches = result.matchAll(/{{#if \(eq event '([^']+)'\)}}([\s\S]*?){{else if \(eq event '([^']+)'\)}}([\s\S]*?){{else if \(or \(eq event '([^']+)'\) \(eq event '([^']+)'\)\)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);
    
    for (const match of legacyLoopMatches) {
      const [fullMatch, condition1, content1, condition2, content2, condition3, condition4, content3, elseContent] = match;
      
      if (eventType === condition1) {
        result = result.replace(fullMatch, content1);
      } else if (eventType === condition2) {
        result = result.replace(fullMatch, content2);
      } else if (eventType === condition3 || eventType === condition4) {
        result = result.replace(fullMatch, content3);
      } else {
        result = result.replace(fullMatch, elseContent);
      }
    }

    // Handle simpler {{#if (eq event 'value')}} conditions
    const simpleIfMatches = result.matchAll(/{{#if \(eq event '([^']+)'\)}}([\s\S]*?){{\/if}}/g);
    
    for (const match of simpleIfMatches) {
      const [fullMatch, condition, content] = match;
      
      if (eventType === condition) {
        result = result.replace(fullMatch, content);
      } else {
        result = result.replace(fullMatch, '');
      }
    }

    // Handle element property conditionals
    const elementIfMatches = result.matchAll(/{{#if element\.([^}]+)}}([\s\S]*?){{\/if}}/g);
    
    for (const match of elementIfMatches) {
      const [fullMatch, property, content] = match;
      
      if (event.element && (event.element as any)[property]) {
        result = result.replace(fullMatch, content);
      } else {
        result = result.replace(fullMatch, '');
      }
    }

    return result;
  }
}

export class CodeGenerator {
  private templateEngine: TemplateEngine;
  private templatesPath: string;

  constructor() {
    this.templateEngine = new SimpleTemplateEngine();
    // Try multiple possible template locations
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'templates'), // Extension directory
      path.join(__dirname, '..', 'templates'),       // Build output relative
      path.join(process.cwd(), 'templates'),         // Workspace root
      path.join(process.cwd(), 'vscode-extension', 'templates') // Workspace vscode-extension
    ];
    
    // Find the first existing templates directory
    this.templatesPath = possiblePaths.find(p => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
      } catch {
        return false;
      }
    }) || possiblePaths[0]; // Fallback to first path
    
    console.log('CodeGenerator templates path:', this.templatesPath);
  }

  public generateTestCode(sessionData: SessionData): string {
    const framework = sessionData.framework;
    const templateFile = this.getTemplateFile(framework);
    
    if (!fs.existsSync(templateFile)) {
      throw new Error(`Template file not found: ${templateFile}`);
    }

    const template = fs.readFileSync(templateFile, 'utf-8');
    
    // Prepare template data
    const templateData = {
      events: sessionData.events,
      testData: sessionData.testData,
      framework: framework,
      sessionId: sessionData.id,
      userRole: sessionData.userRole,
      applicationUrl: sessionData.applicationUrl
    };

    return this.templateEngine.compile(template, templateData);
  }

  public generateTestDataFile(sessionData: SessionData): string {
    return JSON.stringify(sessionData.testData, null, 2);
  }

  private getTemplateFile(framework: string): string {
    const templateFiles = {
      'selenium': 'selenium_template.py',
      'playwright': 'playwright_template.py',
      'cypress': 'cypress_template.ts'
    };

    const fileName = templateFiles[framework as keyof typeof templateFiles];
    if (!fileName) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    return path.join(this.templatesPath, fileName);
  }

  public getFileExtension(framework: string): string {
    const extensions = {
      'selenium': '.py',
      'playwright': '.py',
      'cypress': '.ts'
    };

    return extensions[framework as keyof typeof extensions] || '.txt';
  }

  public getTestDataFileName(): string {
    return 'test_data.json';
  }

  public async saveTestCode(sessionData: SessionData, outputDir: string): Promise<{ codePath: string; dataPath: string }> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate code and data
    const testCode = this.generateTestCode(sessionData);
    const testData = this.generateTestDataFile(sessionData);

    // Create file names
    const extension = this.getFileExtension(sessionData.framework);
    const codeFileName = `test_${sessionData.id}${extension}`;
    const dataFileName = this.getTestDataFileName();

    const codePath = path.join(outputDir, codeFileName);
    const dataPath = path.join(outputDir, dataFileName);

    // Write files
    fs.writeFileSync(codePath, testCode, 'utf-8');
    fs.writeFileSync(dataPath, testData, 'utf-8');

    return { codePath, dataPath };
  }
}
