# TestCaptive Architecture Documentation

This folder contains PlantUML diagrams for presenting TestCaptive to stakeholders.

## Diagrams

### 1. Current Architecture (`current-architecture.puml`)
**Purpose:** Show how TestCaptive works today
**Audience:** Technical team, architects
**Use Case:** Explain the technical implementation

**Key Points:**
- Chrome extension captures events and assertions
- VS Code extension generates code with validations
- Session-based workflow
- Playwright test generation
- **✅ Smart assertion capture (7 types)**
- Context menu integration

---

### 2. Enterprise Vision (`enterprise-vision.puml`)
**Purpose:** Show what TestCaptive could become
**Audience:** Management, investors, product team
**Use Case:** Demonstrate growth potential and roadmap

**Key Points:**
- Cloud-based services
- AI-powered features
- Team collaboration
- Enterprise integrations (CI/CD, test management)
- Security and compliance

---

### 3. User Workflow (`user-workflow.puml`)
**Purpose:** Demonstrate user experience and identify gaps
**Audience:** Product managers, UX designers, QA team
**Use Case:** Show end-to-end workflow and manual steps

**Key Points:**
- Record → Add Assertions → Review → Generate → Export workflow
- **✅ Assertion capture during recording (DONE)**
- Context menu for easy validation
- Future automation opportunities (CI/CD, Git integration)

---

### 4. Selector Algorithm (`selector-algorithm.puml`)
**Purpose:** Explain the smart selector priority logic
**Audience:** Technical team, QA engineers
**Use Case:** Demonstrate technical sophistication and best practices

**Key Points:**
- 6-level priority hierarchy
- Stability scores
- Framework-aware selection
- Enterprise enhancements needed

---

### 5. ROI Analysis (`roi-analysis.puml`)
**Purpose:** Quantify cost savings and time benefits
**Audience:** Management, finance, decision-makers
**Use Case:** Justify investment and prove business value

**Key Points:**
- Manual vs TestCaptive comparison
- Time savings (8-16h → 1-2h per test)
- Cost reduction (80-90%)
- Maintenance savings

---

### 6. Data Flow (`data-flow.puml`)
**Purpose:** Show how data moves through the system
**Audience:** Architects, developers
**Use Case:** Technical design reviews, onboarding new developers

**Key Points:**
- Event capture pipeline
- Template processing
- Multi-pass algorithm
- Output generation

---

## How to Use These Diagrams

### Rendering PlantUML Diagrams

**Option 1: VS Code Extension**
1. Install "PlantUML" extension by jebbs
2. Open any `.puml` file
3. Press `Alt+D` to preview

**Option 2: Online Renderer**
1. Go to http://www.plantuml.com/plantuml/uml/
2. Copy/paste diagram code
3. Download as PNG/SVG

**Option 3: Command Line**
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate PNG
puml generate current-architecture.puml --png

# Generate all diagrams
puml generate *.puml --png
```

---

## Presentation Strategy

### For Management (30-minute pitch)
1. **Start with ROI** (`roi-analysis.puml`)
   - Show cost savings immediately
   - Capture attention with numbers

2. **Explain the vision** (`enterprise-vision.puml`)
   - Show what it could become
   - Demonstrate long-term thinking

3. **Show current state** (`current-architecture.puml`)
   - Prove it's real and working
   - Show technical competence

4. **Outline workflow** (`user-workflow.puml`)
   - Make it tangible and relatable
   - Identify what's needed to fill gaps

### For Technical Audience (1-hour deep dive)
1. **Start with architecture** (`current-architecture.puml`)
   - Show technical design
   - Explain component interactions

2. **Explain data flow** (`data-flow.puml`)
   - Detail processing pipeline
   - Show multi-pass algorithm

3. **Deep dive on selectors** (`selector-algorithm.puml`)
   - Demonstrate best practices
   - Show sophistication

4. **Show enterprise vision** (`enterprise-vision.puml`)
   - Discuss scalability
   - Plan for future features

### For Product/UX Team (45-minute session)
1. **Start with user workflow** (`user-workflow.puml`)
   - Show user journey
   - Identify pain points

2. **Show current solution** (`current-architecture.puml`)
   - Explain how it solves problems
   - Discuss UX considerations

3. **Show vision** (`enterprise-vision.puml`)
   - Collaborate on features
   - Prioritize roadmap

---

## Customization Tips

### Updating Company Branding
Edit the theme colors in any diagram:
```plantuml
!theme plain  # Change to: cerulean, superhero, etc.
skinparam backgroundColor #FFFFFF
skinparam defaultFontColor #333333
```

### Adding Your Logo
```plantuml
sprite $logo [100x100/16] {
  # Your logo sprite data
}

title <$logo> TestCaptive Architecture
```

### Export Formats
- **PNG:** For PowerPoint presentations
- **SVG:** For web documentation (scalable)
- **PDF:** For printed handouts

---

## Next Steps

1. **Review diagrams** with your team
2. **Customize** for your organization (colors, terminology)
3. **Generate exports** in needed formats
4. **Prepare presentation** using `ENTERPRISE_PITCH.md`
5. **Practice pitch** with colleagues before management meeting

---

## Support Documentation

These diagrams complement:
- `ENTERPRISE_PITCH.md` - Full business case and pitch deck
- `ASSERTIONS_GUIDE.md` - Assertion feature documentation and best practices
- `SELECTOR_PRIORITY_EXPLAINED.md` - Technical deep dive
- Code repository - Proof of working implementation

---

## Recent Updates (December 2025)

### ✅ Assertion Feature Added
All diagrams have been updated to reflect the new smart assertion capture feature:
- **7 assertion types** (text, visibility, state, URL validation)
- **Context menu integration** in Chrome extension
- **Automated code generation** for Playwright
- **Zero manual validation** overhead

**Impact on Pitch:**
- Eliminates "no assertions" gap from enterprise readiness
- Significantly strengthens ROI analysis
- Differentiates from competitors (Selenium IDE, Playwright Inspector)
- Makes product immediately usable for CI/CD pipelines

---

**Questions?** Update diagrams as architecture evolves. PlantUML is text-based, so you can version control changes in Git.
