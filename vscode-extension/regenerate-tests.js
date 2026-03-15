// Quick test to regenerate test code files with the updated code generator
const fs = require('fs');
const path = require('path');

// Import the compiled code generator
const { CodeGenerator } = require('./out/code-generator');

// Load the session data
const sessionPath = path.join(__dirname, '..', 'Test-Session', 'testcaptive-session_1765337681653.json');
const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));

// Create code generator
const generator = new CodeGenerator();

// Generate tests for all frameworks
const outputDir = path.join(__dirname, '..', 'Test-Code');

console.log('🔄 Regenerating Playwright test code...\n');

sessionData.framework = 'playwright';
try {
    const testCode = generator.generateTestCode(sessionData);
    const outputFile = path.join(outputDir, 'Playwright.txt');
    
    // Check for template markers
    const hasMarkers = testCode.includes('{{') || testCode.includes('}}');
    
    fs.writeFileSync(outputFile, testCode, 'utf-8');
    
    if (hasMarkers) {
        console.log('⚠️  Playwright: Generated but still contains template markers');
    } else {
        console.log('✅ Playwright: Clean generation (no template markers)');
    }
} catch (error) {
    console.log(`❌ Playwright: Error - ${error.message}`);
}

console.log('\n✨ Done! Check the Test-Code folder for the updated file.');
