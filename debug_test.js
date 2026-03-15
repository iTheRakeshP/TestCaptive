// Direct debug: use the compiled JS module and add logging
const path = require('path');
const fs = require('fs');

// Load the compiled module
const mod = require('./vscode-extension/out/code-generator');

const sd = JSON.parse(fs.readFileSync('Test-Session/testcaptive-session_1773514830002.json', 'utf8'));
sd.framework = 'playwright';

// Find first input event 
const inputEvent = sd.events.find(e => (e.event || e.type) === 'input');

// Read template directly
const tpl = fs.readFileSync('vscode-extension/templates/playwright_template.py', 'utf8');
const eventsMatch = tpl.match(/{{#events}}([\s\S]*?){{\/events}}/);
const eventTemplate = eventsMatch[1].replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');

// Step 1: Variable substitution (same as compile method)
let code = eventTemplate;
const eventType = inputEvent.event || inputEvent.type || '';
const eventValue = inputEvent.inputValue || inputEvent.value || '';
code = code.replace(/{{event}}/g, eventType);
code = code.replace(/{{timestamp}}/g, inputEvent.timestamp || '');
code = code.replace(/{{sessionId}}/g, inputEvent.sessionId || '');
code = code.replace(/{{value}}/g, eventValue);
if (inputEvent.page) {
  code = code.replace(/{{page\.url}}/g, inputEvent.page.url || '');
  code = code.replace(/{{page\.title}}/g, inputEvent.page.title || '');
}
if (inputEvent.element) {
  Object.keys(inputEvent.element).forEach(key => {
    const val = inputEvent.element[key];
    if (val) {
      code = code.replace(new RegExp(`{{element\\.${key}}}`, 'g'), val);
    }
  });
}

// Find the 'Enter text' line BEFORE conditionals
let idx = code.indexOf('Enter text');
if (idx >= 0) {
  const before = code.substring(idx - 4, idx + 120);
  console.log('BEFORE handleConditionals:');
  console.log(JSON.stringify(before));
}

// Now manually call processSinglePass to see what happens
// We need access to the private method, so let's trace manually
// Actually, let's just test with the full CodeGenerator
const singleSd = { ...sd, events: [inputEvent] };
const cg = new mod.CodeGenerator();
const result = cg.generateTestCode(singleSd);

idx = result.indexOf('Enter text');
if (idx >= 0) {
  const after = result.substring(idx - 4, idx + 120);
  console.log('\nAFTER full generation:');
  console.log(JSON.stringify(after));
}
