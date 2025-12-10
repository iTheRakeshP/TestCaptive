const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);  // Handle specific routes
  if (req.url === '/chrome_extension_diagnostic.html') {
    // Serve the Chrome extension diagnostic page
    try {
      const diagnosticContent = fs.readFileSync(path.join(__dirname, 'chrome_extension_diagnostic.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(diagnosticContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Diagnostic page not found');
    }
    return;
  }

  if (req.url === '/simple_content_test.html') {
    // Serve the simple content test page
    try {
      const testContent = fs.readFileSync(path.join(__dirname, 'simple_content_test.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(testContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Simple test page not found');
    }
    return;
  }
    if (req.url === '/content_script_debug.html') {
    // Serve the debug page
    try {
      const debugContent = fs.readFileSync(path.join(__dirname, 'content_script_debug.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(debugContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Debug page not found');
    }
    return;
  }
    if (req.url === '/service_worker_diagnostic.html') {
    // Serve the service worker diagnostic page
    try {
      const diagnosticContent = fs.readFileSync(path.join(__dirname, 'service_worker_diagnostic.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(diagnosticContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Service worker diagnostic page not found');
    }
    return;
  }
  
  if (req.url === '/websocket_test.html') {
    // Serve the WebSocket test page
    try {
      const testContent = fs.readFileSync(path.join(__dirname, 'websocket_test.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(testContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('WebSocket test page not found');
    }
    return;
  }
  
  if (req.url === '/' || req.url === '/demo.html') {
    // Serve the demo page as default
    try {
      const demoContent = fs.readFileSync(path.join(__dirname, 'demo.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(demoContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Demo page not found');
    }
    return;
  }
  
  if (req.url === '/simple_extension_test.html') {
    // Serve the simple extension test page
    try {
      const testContent = fs.readFileSync(path.join(__dirname, 'simple_extension_test.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(testContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Simple extension test page not found');
    }
    return;
  }
  
  if (req.url === '/enhanced_test_page.html') {
    // Serve the enhanced test page
    try {
      const enhancedContent = fs.readFileSync(path.join(__dirname, 'enhanced_test_page.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(enhancedContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Enhanced test page not found');
    }
    return;
  }

  if (req.url === '/quick_diagnostic.html') {
    // Serve the quick diagnostic page
    try {
      const diagnosticContent = fs.readFileSync(path.join(__dirname, 'quick_diagnostic.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(diagnosticContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Quick diagnostic page not found');
    }
    return;
  }

  if (req.url === '/simple_test.html') {
    // Serve the simple test page
    try {
      const simpleContent = fs.readFileSync(path.join(__dirname, 'simple_test.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(simpleContent);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Simple test page not found');
    }
    return;
  }

  // Handle diagnostic script
  if (req.url === '/diagnostic.js') {
    try {
      const diagnosticScript = fs.readFileSync(path.join(__dirname, 'chrome_extension_diagnostic.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(diagnosticScript);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Diagnostic script not found');
    }
    return;
  }
  
  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(port, () => {  console.log(`TestCaptive test server running at http://localhost:${port}`);
  console.log('Open this URL in Chrome to test the extension');
  console.log('🔧 Make sure to load the TestCaptive extension first!');
});
