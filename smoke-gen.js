const Module = require('module');
const path = require('path');
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, p) {
  if (r === 'vscode') return path.resolve(__dirname, 'vscode-stub.js');
  return orig.call(this, r, p);
};
const { CodeGenerator } = require('./vscode-extension/out/code-generator');
const s = require('./test-suite-project/tests/session_1773535419629/session.json');
const code = new CodeGenerator().generateTestCode(s);
console.log(code);
