module.exports = {
  workspace: { getConfiguration: () => ({ get: () => undefined }) },
  window: {
    showErrorMessage: () => {},
    showInformationMessage: () => {},
    createOutputChannel: () => ({ appendLine: () => {}, append: () => {}, show: () => {}, dispose: () => {} }),
  },
  Uri: { file: (p) => ({ fsPath: p }) },
};
