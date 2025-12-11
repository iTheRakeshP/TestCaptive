// Build script for Chrome Extension
const fs = require('fs');
const path = require('path');

console.log('🔨 Building TestCaptive Chrome Extension...\n');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Files to copy
const filesToCopy = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js'
];

// Copy files
filesToCopy.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied: ${file}`);
    } else {
        console.warn(`⚠️  Not found: ${file}`);
    }
});

// Copy src directory if it exists (for TypeScript compiled outputs if any)
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
    const srcFiles = fs.readdirSync(srcDir);
    srcFiles.forEach(file => {
        if (file.endsWith('.js')) {
            const src = path.join(srcDir, file);
            const dest = path.join(distDir, file);
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied from src: ${file}`);
        }
    });
}

console.log('\n✨ Build complete! Extension is ready in ./dist folder');
console.log('\n📦 To package as ZIP, run: npm run package');
console.log('🚀 To load in Chrome:');
console.log('   1. Open chrome://extensions/');
console.log('   2. Enable "Developer mode"');
console.log('   3. Click "Load unpacked"');
console.log('   4. Select the "dist" folder\n');
