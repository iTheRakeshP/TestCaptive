// Build script for Chrome Extension
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('🔨 Building TestCaptive Chrome Extension...\n');

const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Bundle each entry point with esbuild (resolves imports into single files)
const entryPoints = [
    { in: 'src/content.ts', out: 'content' },
    { in: 'src/background.ts', out: 'background' },
    { in: 'src/popup.ts', out: 'popup' },
];

async function build() {
    try {
        await esbuild.build({
            entryPoints: entryPoints.map(e => ({ in: e.in, out: e.out })),
            bundle: true,
            outdir: distDir,
            format: 'iife',
            target: 'chrome100',
            minify: false,
            sourcemap: false,
        });
        entryPoints.forEach(e => console.log(`✅ Bundled: ${e.in} → dist/${e.out}.js`));
    } catch (err) {
        console.error('❌ esbuild failed:', err.message);
        process.exit(1);
    }

    // Copy non-JS config/HTML files into dist
    const configFiles = ['manifest.json', 'popup.html'];
    configFiles.forEach(file => {
        const src = path.join(__dirname, file);
        const dest = path.join(distDir, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied: ${file}`);
        } else {
            console.warn(`⚠️  Not found: ${file}`);
        }
    });

    // Verify required JS files exist in dist
    const requiredJS = ['content.js', 'background.js', 'popup.js'];
    let allPresent = true;
    requiredJS.forEach(file => {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ Present: dist/${file}`);
        } else {
            console.error(`❌ Missing: dist/${file}`);
            allPresent = false;
        }
    });

    if (!allPresent) {
        console.error('\n❌ Build incomplete — some JS files are missing from dist/');
        process.exit(1);
    }

    console.log('\n✨ Build complete! Extension is ready in ./dist folder');
    console.log('\n📦 To package as ZIP, run: npm run package');
    console.log('🚀 To load in Chrome:');
    console.log('   1. Open chrome://extensions/');
    console.log('   2. Enable "Developer mode"');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the "dist" folder\n');
}

build();
