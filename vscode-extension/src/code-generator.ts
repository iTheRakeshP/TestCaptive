// Code generator for test scripts
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { TestEvent, SessionData } from './types';

export interface TemplateEngine {
  compile(template: string, data: any): string;
}

// Handlebars-based template engine implementation
class HandlebarsTemplateEngine implements TemplateEngine {
  constructor() {
    // Register custom Handlebars helpers
    this.registerHelpers();
  }

  private registerHelpers() {
    // Helper for equality check
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    // Helper for OR logic
    Handlebars.registerHelper('or', function(...args: any[]) {
      // Last argument is the options object
      const options = args[args.length - 1];
      // Check all arguments except the last one
      for (let i = 0; i < args.length - 1; i++) {
        if (args[i]) {
          return true;
        }
      }
      return false;
    });
  }

  compile(template: string, data: any): string {
    // Process events to add isFirstNavigation flag and debounce
    if (data.events && Array.isArray(data.events)) {
      const processedEvents: TestEvent[] = [];
      let navigationCount = 0;

      for (let i = 0; i < data.events.length; i++) {
        const currentEvent = data.events[i];
        const nextEvent = i < data.events.length - 1 ? data.events[i + 1] : null;
        
        const currentType = currentEvent.event || currentEvent.type;
        
        // Add isFirstNavigation flag for navigation events
        if (currentType === 'navigation') {
          navigationCount++;
          (currentEvent as any).isFirstNavigation = (navigationCount === 1);
        }
        
        // Filter out redundant input events (debounce on the generator side)
        if (currentType === 'input' && nextEvent) {
          const nextType = nextEvent.event || nextEvent.type;
          // Use selector or xpath to identify the element
          const currentSelector = currentEvent.selector || (currentEvent.element && currentEvent.element.xpath) || (currentEvent.element && currentEvent.element.id);
          const nextSelector = nextEvent.selector || (nextEvent.element && nextEvent.element.xpath) || (nextEvent.element && nextEvent.element.id);
          
          if (nextType === 'input' && currentSelector && nextSelector && currentSelector === nextSelector) {
            continue; // Skip this event as it's an intermediate input
          }
        }
        
        // Add event and value properties for easier access in templates
        (currentEvent as any).event = currentType;
        (currentEvent as any).value = currentEvent.inputValue || currentEvent.value || (currentEvent.element && currentEvent.element.value) || '';
        
        processedEvents.push(currentEvent);
      }
      
      data.events = processedEvents;
    }

    // Compile and execute the template
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  }
}

export class CodeGenerator {
  private templateEngine: TemplateEngine;
  private templatesPath: string;

  constructor() {
    this.templateEngine = new HandlebarsTemplateEngine();
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
