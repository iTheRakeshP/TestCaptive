// Code generator for test scripts
import * as fs from 'fs';
import * as path from 'path';
import { TestEvent, SessionData } from './types';

export interface TemplateEngine {
  compile(template: string, data: any): string;
}

// Simple template engine implementation
class SimpleTemplateEngine implements TemplateEngine {
  /**
   * Escape a string for safe inclusion inside Python double-quoted string literals.
   * Handles backslashes, quotes, and newlines that would break generated code.
   */
  private escapePythonString(value: string): string {
    return value
      .replace(/\\/g, '\\\\')   // backslashes first
      .replace(/"/g, '\\"')     // double quotes
      .replace(/'/g, "\\'")     // single quotes
      .replace(/\n/g, '\\n')    // newlines
      .replace(/\r/g, '\\r')    // carriage returns
      .replace(/\t/g, '\\t');   // tabs
  }

  compile(template: string, data: any): string {
    try {
      let result = template;

    // Handle {{#events}} loops
    const eventsMatch = result.match(/{{#events}}([\s\S]*?){{\/events}}/);
    if (eventsMatch && data.events) {
      // Remove leading newline and trailing whitespace from the template to avoid blank lines
      const eventTemplate = eventsMatch[1].replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');
      const generatedEvents: string[] = [];
      let navigationCount = 0;

      // Smart event coalescence — handles both new 'fill' events and legacy 'input' events
      const processedEvents: TestEvent[] = [];
      if (data.events && Array.isArray(data.events)) {
        const events = data.events;
        let i = 0;
        while (i < events.length) {
          const current = events[i];
          const currentType = current.event || (current as any).type;
          const currentKey = this.getElementKey(current);

          // Skip focus/blur events entirely (legacy sessions may have them)
          if (currentType === 'focus' || currentType === 'blur') {
            i++;
            continue;
          }

          // For 'fill' events: merge consecutive fills on the same element (keep last value)
          if (currentType === 'fill') {
            let lastFillEvent = current;
            let j = i + 1;
            while (j < events.length) {
              const next = events[j];
              const nextType = next.event || (next as any).type;
              const nextKey = this.getElementKey(next);
              if (nextType === 'focus' || nextType === 'blur') { j++; continue; }
              if (nextType === 'fill' && nextKey === currentKey) {
                lastFillEvent = next;
                j++;
                continue;
              }
              break;
            }
            processedEvents.push(lastFillEvent);
            i = j;
            continue;
          }

          // For legacy 'input' events: merge consecutive inputs on the same element into one 'fill'
          if (currentType === 'input') {
            let lastInputEvent = current;
            let j = i + 1;
            while (j < events.length) {
              const next = events[j];
              const nextType = next.event || (next as any).type;
              const nextKey = this.getElementKey(next);
              // Skip focus/blur between inputs on same field
              if (nextType === 'focus' || nextType === 'blur') { j++; continue; }
              // Keep merging consecutive inputs on same element
              if (nextType === 'input' && nextKey === currentKey) {
                lastInputEvent = next;
                j++;
                continue;
              }
              break;
            }
            // Convert the last input to a 'fill' event
            const fillEvent = { ...lastInputEvent };
            if (fillEvent.event) { fillEvent.event = 'fill' as any; }
            else { (fillEvent as any).type = 'fill'; }
            processedEvents.push(fillEvent);
            i = j;
            continue;
          }

          // Click on text-like inputs before input/fill events: skip (implicit in fill)
          // Click on <select> elements before/after select events: skip (implicit in select)
          if (currentType === 'click' && current.element) {
            const tag = current.element.tag?.toLowerCase();
            const inputType = current.element.type?.toLowerCase() || 'text';
            const isTextInput = tag === 'textarea' ||
              (tag === 'input' && ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(inputType));
            const isSelect = tag === 'select';

            if (isTextInput) {
              // Look ahead for input/fill on same element
              let hasFollowingFill = false;
              for (let k = i + 1; k < Math.min(i + 5, events.length); k++) {
                const ahead = events[k];
                const aheadType = ahead.event || (ahead as any).type;
                if (aheadType === 'focus' || aheadType === 'blur') continue;
                if ((aheadType === 'input' || aheadType === 'fill') && this.getElementKey(ahead) === currentKey) {
                  hasFollowingFill = true;
                }
                break;
              }
              if (hasFollowingFill) {
                i++;
                continue; // Skip this click — it's just clicking into a text field
              }
            }

            // Skip clicks on <select> elements — the 'select' event captures the action
            if (isSelect) {
              i++;
              continue;
            }

            // Skip clicks on checkbox/radio before 'check' events
            if (tag === 'input' && (inputType === 'checkbox' || inputType === 'radio')) {
              let hasFollowingCheck = false;
              for (let k = i + 1; k < Math.min(i + 3, events.length); k++) {
                const ahead = events[k];
                const aheadType = ahead.event || (ahead as any).type;
                if (aheadType === 'check' && this.getElementKey(ahead) === currentKey) {
                  hasFollowingCheck = true;
                  break;
                }
              }
              if (hasFollowingCheck) {
                i++;
                continue;
              }
            }
          }

          // Skip Tab keydown events (just field navigation)
          if (currentType === 'keydown') {
            const keyValue = current.value || current.inputValue || '';
            if (keyValue === 'Tab') {
              i++;
              continue;
            }
          }

          // For legacy 'change' events on text inputs: convert to fill
          if (currentType === 'change' && current.element) {
            const tag = current.element.tag?.toLowerCase();
            const inputType = current.element.type?.toLowerCase() || 'text';
            const isTextInput = tag === 'textarea' ||
              (tag === 'input' && ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(inputType));
            if (isTextInput) {
              const fillEvent = { ...current };
              if (fillEvent.event) { fillEvent.event = 'fill' as any; }
              else { (fillEvent as any).type = 'fill'; }
              processedEvents.push(fillEvent);
              i++;
              continue;
            }
          }

          processedEvents.push(current);
          i++;
        }
      }

      processedEvents.forEach((event: TestEvent, index: number) => {
        let eventCode = eventTemplate;
        const eventType = event.event || (event as any).type || '';
        // For scroll events, extract scrollY from scrollPosition
        let eventValue = event.inputValue || event.value || (event.element && event.element.value) || '';
        if (eventType === 'scroll' && !eventValue) {
          const scrollPos = (event as any).scrollPosition;
          if (scrollPos) {
            eventValue = String(scrollPos.y || 0);
          } else if (event.page && (event.page as any).scrollY !== undefined) {
            eventValue = String((event.page as any).scrollY);
          }
        }
        
        if (eventType === 'navigation') {
            navigationCount++;
            (event as any).isFirstNavigation = (navigationCount === 1);
        }
        
        // Copy selector to element.cssSelector if it doesn't exist
        if (event.element && (event as any).selector && !event.element.cssSelector) {
          (event.element as any).cssSelector = (event as any).selector;
        }

        // Replace event-specific variables
        eventCode = eventCode.replace(/{{event}}/g, eventType);
        eventCode = eventCode.replace(/{{timestamp}}/g, event.timestamp);
        eventCode = eventCode.replace(/{{sessionId}}/g, event.sessionId);
        eventCode = eventCode.replace(/{{value}}/g, this.escapePythonString(eventValue));
        
        // Replace page variables
        if (event.page) {
          eventCode = eventCode.replace(/{{page\.url}}/g, this.escapePythonString(event.page.url || ''));
          eventCode = eventCode.replace(/{{page\.title}}/g, this.escapePythonString(event.page.title || ''));
        }
        
        // Replace element variables BEFORE conditionals
        if (event.element) {
          Object.keys(event.element).forEach(key => {
            const value = (event.element as any)[key];
            if (value) {
              eventCode = eventCode.replace(new RegExp(`{{element\\.${key}}}`, 'g'), this.escapePythonString(String(value)));
            }
          });
        }
        
        // Handle conditional statements
        eventCode = this.handleConditionals(eventCode, event);
        
        // Replace element variables AFTER conditionals (in case they were in selected branches)
        if (event.element) {
          Object.keys(event.element).forEach(key => {
            const value = (event.element as any)[key];
            if (value) {
              eventCode = eventCode.replace(new RegExp(`{{element\\.${key}}}`, 'g'), this.escapePythonString(String(value)));
            }
          });
        }
        
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Template compilation failed: ${message}`);
    }
  }

  private handleConditionals(template: string, event: TestEvent): string {
    let result = template;
    let previousResult = '';
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops
    
    // Keep processing until no more changes or max iterations reached
    while (result !== previousResult && iterations < maxIterations) {
      previousResult = result;
      result = this.processSinglePass(result, event);
      iterations++;
    }
    
    return result;
  }
  
  private processSinglePass(template: string, event: TestEvent): string {
    let result = template;
    const eventType = event.event || (event as any).type || '';
    const eventValue = event.inputValue || event.value || (event.element && event.element.value) || '';

    // CRITICAL: Resolve the event-type chain FIRST, before any inner selector chains.
    // This extracts only the matching branch content, eliminating cross-branch interference.
    result = this.processEventTypeChain(result, eventType);

    // Resolve ALL element property conditional chains (selector chains, field name chains, text checks)
    // Uses nesting-aware depth tracking — handles any number of branches correctly
    result = this.processElementSelectorChain(result, event);

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

    // Handle {{#if isFirstNavigation}} - check if property exists on event
    // Only match simple property names (\w+), not complex expressions like (eq assertion.type '...')
    const simplePropertyMatches = result.matchAll(/{{#if (\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g);
    for (const match of simplePropertyMatches) {
      const [fullMatch, property, contentIf, contentElse] = match;
      const propertyValue = (event as any)[property];
      
      if (propertyValue) {
        result = result.replace(fullMatch, contentIf);
      } else {
        result = result.replace(fullMatch, contentElse);
      }
    }

    // Handle assertion type conditionals - {{#if (eq assertion.type 'text-equals')}}
    // Uses nesting-aware depth tracking (assertion type blocks contain nested element selector blocks)
    result = this.processAssertionTypeChain(result, event);

    // Handle assertion.element conditionals - {{#if assertion.element.testid}}
    // These may remain after assertion type selection — process them like element selector chains
    result = this.processAssertionElementChain(result, event);

    // Handle event.assertion variable replacements
    const assertion = (event as any).assertion;
    if (assertion) {
      // Replace assertion.type
      if (assertion.type) {
        result = result.replace(/{{event\.assertion\.type}}/g, assertion.type);
      }
      
      // Replace assertion.expectedValue
      if (assertion.expectedValue !== undefined) {
        result = result.replace(/{{event\.assertion\.expectedValue}}/g, this.escapePythonString(String(assertion.expectedValue)));
      }
      
      // Replace assertion.description
      if (assertion.description) {
        result = result.replace(/{{event\.assertion\.description}}/g, this.escapePythonString(assertion.description));
      }
      
      // Replace assertion.attributeName
      if (assertion.attributeName) {
        result = result.replace(/{{event\.assertion\.attributeName}}/g, this.escapePythonString(assertion.attributeName));
      }
      
      // Replace assertion.element properties
      if (assertion.element) {
        Object.keys(assertion.element).forEach(key => {
          const value = assertion.element[key];
          if (value) {
            result = result.replace(new RegExp(`{{event\\.assertion\\.element\\.${key}}}`, 'g'), this.escapePythonString(String(value)));
          }
        });
      }
    }

    // Clean up orphaned template tags (bounded to single lines to avoid deleting code)
    // Remove orphaned {{else if ...}} through the next template tag on the same logical block
    result = result.replace(/{{else\s+if\s+[^}]+}}[^\n]*\n?/g, '');
    // Remove orphaned {{else}} tags (single line only)
    result = result.replace(/{{else}}[^\n]*\n?/g, '');
    // Remove orphaned {{/if}} tags
    result = result.replace(new RegExp('{{/if}}[^\\n]*\\n?', 'g'), '');

    return result;
  }

  /**
   * Nesting-aware parser for element property conditional chains.
   * Handles ANY {{#if element.PROPERTY}}...{{else if element.PROPERTY2}}...{{/if}} block
   * regardless of how many branches or which properties are used.
   */
  private processElementSelectorChain(template: string, event: TestEvent): string {
    let result = template;
    const startPattern = /{{#if\s+element\.(\w+)}}/;
    let searchPos = 0;

    while (searchPos < result.length) {
      const remaining = result.substring(searchPos);
      const startMatch = remaining.match(startPattern);

      if (!startMatch || startMatch.index === undefined) { break; }

      const blockStart = searchPos + startMatch.index;

      // Walk forward tracking depth to find the matching {{/if}}
      let depth = 1;
      let pos = blockStart + startMatch[0].length;
      let foundEnd = false;

      while (depth > 0 && pos < result.length) {
        const rest = result.substring(pos);
        const nextOpen = rest.search(/{{#if\s/);
        const nextClose = rest.search(/{{\/if}}/);

        if (nextClose === -1) { break; }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos += nextOpen + 1;
        } else {
          depth--;
          if (depth === 0) {
            const blockEnd = pos + nextClose + '{{/if}}'.length;
            const fullBlock = result.substring(blockStart, blockEnd);
            const replacement = this.selectElementBranch(fullBlock, event);
            result = result.substring(0, blockStart) + replacement + result.substring(blockEnd);
            searchPos = blockStart + replacement.length;
            foundEnd = true;
            break;
          }
          pos += nextClose + '{{/if}}'.length;
        }
      }

      if (!foundEnd) {
        // No matching close found, skip past this tag
        searchPos = blockStart + startMatch[0].length;
      }
    }

    return result;
  }

  /**
   * Given an element property conditional block, extract branches and select the matching one.
   * Handles blocks like {{#if element.testid}}...{{else if element.id}}...{{else}}...{{/if}}
   */
  private selectElementBranch(block: string, event: TestEvent): string {
    const branches: Array<{ property: string; startContent: number; endContent: number }> = [];
    let elseStart = -1;
    let elseEnd = -1;
    let depth = 0;

    const tagPattern = /{{(#if|else if|else|\/if)([^}]*)}}/g;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagPattern.exec(block)) !== null) {
      const tagType = tagMatch[1];
      const tagArgs = tagMatch[2].trim();
      const tagEnd = tagMatch.index + tagMatch[0].length;

      if (tagType === '#if') {
        if (depth === 0) {
          const propMatch = tagArgs.match(/^element\.(\w+)$/);
          if (propMatch) {
            branches.push({ property: propMatch[1], startContent: tagEnd, endContent: block.length });
          }
        }
        depth++;
      } else if (tagType === '/if') {
        depth--;
        if (depth === 0) {
          if (elseStart === -1 && branches.length > 0) {
            branches[branches.length - 1].endContent = tagMatch.index;
          }
          if (elseStart !== -1) {
            elseEnd = tagMatch.index;
          }
          break;
        }
      } else if (depth === 1 && tagType === 'else if') {
        if (branches.length > 0) {
          branches[branches.length - 1].endContent = tagMatch.index;
        }
        const propMatch = tagArgs.match(/^element\.(\w+)$/);
        if (propMatch) {
          branches.push({ property: propMatch[1], startContent: tagEnd, endContent: block.length });
        }
      } else if (depth === 1 && tagType === 'else') {
        if (branches.length > 0) {
          branches[branches.length - 1].endContent = tagMatch.index;
        }
        elseStart = tagEnd;
      }
    }

    // Select matching branch based on element property truthiness
    for (const branch of branches) {
      if (event.element && (event.element as any)[branch.property]) {
        return block.substring(branch.startContent, branch.endContent);
      }
    }

    // Else branch
    if (elseStart !== -1) {
      return block.substring(elseStart, elseEnd !== -1 ? elseEnd : block.length);
    }

    // No match and no else — return empty
    return '';
  }

  /**
   * Nesting-aware parser for the main event-type conditional chain.
   * Finds the outermost {{#if (eq event '...')}}...{{/if}} block by tracking
   * nesting depth, then extracts branches and selects the matching one.
   */
  private processEventTypeChain(template: string, eventType: string): string {
    let result = template;
    
    // Find the start of an event-type chain
    const startPattern = /{{#if \((?:eq event '([^']+)'|or \(eq event '([^']+)'\) \(eq event '([^']+)'\))\)}}/;
    let startMatch = result.match(startPattern);
    
    while (startMatch && startMatch.index !== undefined) {
      const blockStart = startMatch.index;
      
      // Walk forward from after the opening tag, tracking nesting depth
      let depth = 1;
      let pos = blockStart + startMatch[0].length;
      const ifOpenPattern = /{{#if\s/;
      const ifClosePattern = /{{\/if}}/;
      
      while (depth > 0 && pos < result.length) {
        const remaining = result.substring(pos);
        const nextOpen = remaining.search(ifOpenPattern);
        const nextClose = remaining.search(ifClosePattern);
        
        if (nextClose === -1) { break; } // No matching close found
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Found a nested {{#if before the next {{/if}}
          depth++;
          pos += nextOpen + 1; // Move past the {{#if start
        } else {
          // Found {{/if}}
          depth--;
          if (depth === 0) {
            // This is the matching outer {{/if}}
            const blockEnd = pos + nextClose + '{{/if}}'.length;
            const fullBlock = result.substring(blockStart, blockEnd);
            
            // Now parse branches at depth 0 within this block
            const replacement = this.selectEventBranch(fullBlock, eventType);
            result = result.substring(0, blockStart) + replacement + result.substring(blockEnd);
            break;
          }
          pos += nextClose + '{{/if}}'.length;
        }
      }
      
      // Look for next event-type chain after current position
      const searchFrom = blockStart + (depth === 0 ? 0 : startMatch[0].length);
      const nextResult = result.substring(searchFrom + 1);
      startMatch = nextResult.match(startPattern);
      if (startMatch && startMatch.index !== undefined) {
        startMatch.index += searchFrom + 1;
      }
    }
    
    return result;
  }

  /**
   * Given a full event-type block (from {{#if (eq event...)}} to its matching {{/if}}),
   * extract branches at depth 0 and return the content of the matching branch.
   */
  private selectEventBranch(block: string, eventType: string): string {
    // Find all depth-0 branch boundaries
    // These are: {{#if (eq event '...')}} / {{else if (eq event '...')}} / {{else if (or ...)}} / {{else}} / {{/if}}
    const branches: Array<{ conditions: string[]; startContent: number }> = [];
    let elseStart = -1;
    let depth = 0;
    let pos = 0;
    
    const tagPattern = /{{(#if|else if|else|\/if)([^}]*)}}/g;
    let tagMatch: RegExpExecArray | null;
    
    while ((tagMatch = tagPattern.exec(block)) !== null) {
      const tagType = tagMatch[1];
      const tagArgs = tagMatch[2];
      const tagEnd = tagMatch.index + tagMatch[0].length;
      
      if (tagType === '#if') {
        if (depth === 0) {
          // This is the opening tag — extract conditions
          const conditions = this.extractEventConditions(tagArgs);
          if (conditions.length > 0) {
            branches.push({ conditions, startContent: tagEnd });
          }
        }
        depth++;
      } else if (tagType === '/if') {
        depth--;
        if (depth === 0) {
          // End of the block — mark the end of the last branch
          // The content ends at tagMatch.index
          if (branches.length > 0) {
            (branches[branches.length - 1] as any).endContent = tagMatch.index;
          }
          if (elseStart !== -1) {
            (branches as any).__elseEnd = tagMatch.index;
          }
          break;
        }
      } else if (depth === 1 && tagType === 'else if') {
        // Depth-0 branch boundary (depth is 1 because we're inside the outer #if)
        // Close previous branch
        if (branches.length > 0) {
          (branches[branches.length - 1] as any).endContent = tagMatch.index;
        }
        const conditions = this.extractEventConditions(tagArgs);
        if (conditions.length > 0) {
          branches.push({ conditions, startContent: tagEnd });
        }
      } else if (depth === 1 && tagType === 'else') {
        // Close previous branch
        if (branches.length > 0) {
          (branches[branches.length - 1] as any).endContent = tagMatch.index;
        }
        elseStart = tagEnd;
      }
    }
    
    // Find matching branch
    for (const branch of branches) {
      if (branch.conditions.includes(eventType)) {
        const end = (branch as any).endContent || block.length;
        return block.substring(branch.startContent, end);
      }
    }
    
    // No match — return else content or empty
    if (elseStart !== -1) {
      const elseEnd = (branches as any).__elseEnd || block.length;
      return block.substring(elseStart, elseEnd);
    }
    
    return '';
  }

  /**
   * Extract event type conditions from a tag's arguments string.
   * Handles both: (eq event 'click') and (or (eq event 'change') (eq event 'input'))
   */
  private extractEventConditions(args: string): string[] {
    const conditions: string[] = [];
    const eqMatches = args.matchAll(/eq event '([^']+)'/g);
    for (const m of eqMatches) {
      conditions.push(m[1]);
    }
    return conditions;
  }

  /**
   * Nesting-aware parser for assertion type conditional chains.
   * Handles {{#if (eq assertion.type 'visible')}}...{{else if (eq assertion.type 'text-equals')}}...{{/if}}
   * with nested {{#if assertion.element.XXX}} blocks inside each branch.
   */
  private processAssertionTypeChain(template: string, event: TestEvent): string {
    let result = template;
    const startPattern = /{{#if \(eq assertion\.type '([^']+)'\)}}/;
    let startMatch = result.match(startPattern);

    while (startMatch && startMatch.index !== undefined) {
      const blockStart = startMatch.index;
      let depth = 1;
      let pos = blockStart + startMatch[0].length;

      while (depth > 0 && pos < result.length) {
        const rest = result.substring(pos);
        const nextOpen = rest.search(/{{#if\s/);
        const nextClose = rest.search(/{{\/if}}/);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos += nextOpen + 1;
        } else {
          depth--;
          if (depth === 0) {
            const blockEnd = pos + nextClose + '{{/if}}'.length;
            const fullBlock = result.substring(blockStart, blockEnd);
            const replacement = this.selectAssertionBranch(fullBlock, event);
            result = result.substring(0, blockStart) + replacement + result.substring(blockEnd);
            break;
          }
          pos += nextClose + '{{/if}}'.length;
        }
      }

      const nextResult = result.substring(blockStart + 1);
      startMatch = nextResult.match(startPattern);
      if (startMatch && startMatch.index !== undefined) {
        startMatch.index += blockStart + 1;
      }
    }
    return result;
  }

  private selectAssertionBranch(block: string, event: TestEvent): string {
    const assertion = (event as any).assertion;
    if (!assertion || !assertion.type) return '';

    const branches: Array<{ type: string; startContent: number; endContent: number }> = [];
    let elseStart = -1;
    let depth = 0;
    const tagPattern = /{{(#if|else if|else|\/if)([^}]*)}}/g;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagPattern.exec(block)) !== null) {
      const tagType = tagMatch[1];
      const tagArgs = tagMatch[2].trim();
      const tagEnd = tagMatch.index + tagMatch[0].length;

      if (tagType === '#if') {
        if (depth === 0) {
          const typeMatch = tagArgs.match(/\(eq assertion\.type '([^']+)'\)/);
          if (typeMatch) {
            branches.push({ type: typeMatch[1], startContent: tagEnd, endContent: block.length });
          }
        }
        depth++;
      } else if (tagType === '/if') {
        depth--;
        if (depth === 0) {
          if (elseStart === -1 && branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
          break;
        }
      } else if (depth === 1 && tagType === 'else if') {
        if (branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
        const typeMatch = tagArgs.match(/\(eq assertion\.type '([^']+)'\)/);
        if (typeMatch) {
          branches.push({ type: typeMatch[1], startContent: tagEnd, endContent: block.length });
        }
      } else if (depth === 1 && tagType === 'else') {
        if (branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
        elseStart = tagEnd;
      }
    }

    for (const branch of branches) {
      if (branch.type === assertion.type) {
        return block.substring(branch.startContent, branch.endContent);
      }
    }
    return '';
  }

  /**
   * Process assertion.element conditional chains remaining after assertion type selection.
   */
  private processAssertionElementChain(template: string, event: TestEvent): string {
    let result = template;
    const startPattern = /{{#if\s+assertion\.element\.(\w+)}}/;
    let searchPos = 0;

    while (searchPos < result.length) {
      const remaining = result.substring(searchPos);
      const startMatch = remaining.match(startPattern);
      if (!startMatch || startMatch.index === undefined) break;

      const blockStart = searchPos + startMatch.index;
      let depth = 1;
      let pos = blockStart + startMatch[0].length;
      let foundEnd = false;

      while (depth > 0 && pos < result.length) {
        const rest = result.substring(pos);
        const nextOpen = rest.search(/{{#if\s/);
        const nextClose = rest.search(/{{\/if}}/);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos += nextOpen + 1;
        } else {
          depth--;
          if (depth === 0) {
            const blockEnd = pos + nextClose + '{{/if}}'.length;
            const fullBlock = result.substring(blockStart, blockEnd);
            const replacement = this.selectAssertionElementBranch(fullBlock, event);
            result = result.substring(0, blockStart) + replacement + result.substring(blockEnd);
            searchPos = blockStart + replacement.length;
            foundEnd = true;
            break;
          }
          pos += nextClose + '{{/if}}'.length;
        }
      }
      if (!foundEnd) searchPos = blockStart + startMatch[0].length;
    }
    return result;
  }

  private selectAssertionElementBranch(block: string, event: TestEvent): string {
    const assertion = (event as any).assertion;
    if (!assertion || !assertion.element) return '';

    const branches: Array<{ property: string; startContent: number; endContent: number }> = [];
    let elseStart = -1;
    let elseEnd = -1;
    let depth = 0;
    const tagPattern = /{{(#if|else if|else|\/if)([^}]*)}}/g;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = tagPattern.exec(block)) !== null) {
      const tagType = tagMatch[1];
      const tagArgs = tagMatch[2].trim();
      const tagEnd = tagMatch.index + tagMatch[0].length;

      if (tagType === '#if') {
        if (depth === 0) {
          const propMatch = tagArgs.match(/^assertion\.element\.(\w+)$/);
          if (propMatch) branches.push({ property: propMatch[1], startContent: tagEnd, endContent: block.length });
        }
        depth++;
      } else if (tagType === '/if') {
        depth--;
        if (depth === 0) {
          if (elseStart === -1 && branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
          if (elseStart !== -1) elseEnd = tagMatch.index;
          break;
        }
      } else if (depth === 1 && tagType === 'else if') {
        if (branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
        const propMatch = tagArgs.match(/^assertion\.element\.(\w+)$/);
        if (propMatch) branches.push({ property: propMatch[1], startContent: tagEnd, endContent: block.length });
      } else if (depth === 1 && tagType === 'else') {
        if (branches.length > 0) branches[branches.length - 1].endContent = tagMatch.index;
        elseStart = tagEnd;
      }
    }

    for (const branch of branches) {
      if (assertion.element[branch.property]) {
        return block.substring(branch.startContent, branch.endContent);
      }
    }
    if (elseStart !== -1) {
      return block.substring(elseStart, elseEnd !== -1 ? elseEnd : block.length);
    }
    return '';
  }

  /** Get a stable identity key for an element to detect same-field events */
  private getElementKey(event: TestEvent): string {
    const el = event.element;
    if (!el) return '';
    return el.testid || el.id || el.name || (event as any).selector || el.xpath || '';
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
    if (!sessionData.events || sessionData.events.length === 0) {
      throw new Error('No events found in session data');
    }

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

    const result = this.templateEngine.compile(template, templateData);
    
    // Verify no unresolved template tags remain (except comments)
    const unresolvedTags = result.match(/{{(?!!)(?!--)([^}]+)}}/g);
    if (unresolvedTags && unresolvedTags.length > 0) {
      console.warn('Unresolved template tags found:', unresolvedTags.slice(0, 5));
    }

    // Normalize line endings to LF, strip trailing whitespace per line, collapse blank lines
    return result
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  public generateTestDataFile(sessionData: SessionData): string {
    return JSON.stringify(sessionData.testData, null, 2);
  }

  private getTemplateFile(framework: string): string {
    if (framework !== 'playwright') {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    return path.join(this.templatesPath, 'playwright_template.py');
  }

  public getFileExtension(framework: string): string {
    return '.py';
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
