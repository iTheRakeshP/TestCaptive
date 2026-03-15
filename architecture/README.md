# Architecture Diagrams

PlantUML diagrams documenting TestCaptive's architecture.

## Diagrams

| File | Description |
|------|-------------|
| `current-architecture.puml` | Component diagram: Chrome extension, VS Code extension, data flow |
| `data-flow.puml` | Sequence diagram: recording → export → import → code generation pipeline |
| `selector-algorithm.puml` | Flowchart: 6-level selector priority (testid → aria → id → name → xpath → CSS) |
| `user-workflow.puml` | Activity diagram: record → add assertions → import → generate → export |

## Rendering

**VS Code:** Install "PlantUML" extension (jebbs), open `.puml` file, press `Alt+D`.

**Online:** Paste content at http://www.plantuml.com/plantuml/uml/

**CLI:**
```bash
npm install -g node-plantuml
puml generate current-architecture.puml --png
```
