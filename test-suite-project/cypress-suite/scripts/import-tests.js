const fs = require('fs');
const path = require('path');

/**
 * Script to import generated Cypress tests from Test-Code folder
 * Converts .txt files to proper .cy.ts test files
 */

const SOURCE_DIR = path.join(__dirname, '../../../Test-Code');
const TARGET_DIR = path.join(__dirname, '../cypress/e2e');
const SOURCE_FILE = 'Cypress.txt';
const TARGET_FILE = 'testcaptive-generated.cy.ts';

function importTests() {
  try {
    // Ensure target directory exists
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // Read source file
    const sourcePath = path.join(SOURCE_DIR, SOURCE_FILE);
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    let content = fs.readFileSync(sourcePath, 'utf8');

    // Clean up the content - remove any template artifacts
    content = content.replace(/\{\{[\s\S]*?\}\}/g, ''); // Remove handlebars templates
    
    // Fix duplicate variable declarations
    const lines = content.split('\n');
    const processedLines = [];
    const declaredVars = new Set();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const varMatch = line.match(/^\s*let\s+(\w+)\s*=/);
      
      if (varMatch) {
        const varName = varMatch[1];
        if (declaredVars.has(varName)) {
          // Change to assignment instead of declaration
          processedLines.push(line.replace(/^\s*let\s+/, '    '));
        } else {
          declaredVars.add(varName);
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    content = processedLines.join('\n');

    // Write to target
    const targetPath = path.join(TARGET_DIR, TARGET_FILE);
    fs.writeFileSync(targetPath, content, 'utf8');

    console.log('✅ Successfully imported Cypress tests!');
    console.log(`📁 Source: ${sourcePath}`);
    console.log(`📁 Target: ${targetPath}`);
    console.log('\n🚀 You can now run the tests with:');
    console.log('   npm test          - Run tests in headless mode');
    console.log('   npm run test:open - Open Cypress Test Runner');
  } catch (error) {
    console.error('❌ Error importing tests:', error.message);
    process.exit(1);
  }
}

importTests();
