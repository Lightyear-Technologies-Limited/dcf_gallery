---
name: hivemind-brand
description: Applies Hivemind Capital's official brand identity - colors, typography, logos, and document layout - to Word documents (.docx), presentations, and other deliverables. Use this skill ONLY when the user explicitly requests Hivemind branding, e.g. "apply the Hivemind brand", "use Hivemind styling", "brand this document", "make it look like a Hivemind doc", or similar phrasing. Do NOT apply automatically to every document - branding is opt-in and should only activate when directly asked.
---

# Hivemind Capital - Brand Skill

Apply this skill when the user asks to brand a document with Hivemind Capital's identity. It covers colors, logos, typography, and the repeatable docx layout patterns that have been validated against the official brand toolkit.

---

## Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `HM_GREEN` | `#0F2623` | Primary dark - cover backgrounds, H1 headings, table headers |
| `HM_DARK_GREEN` | `#10352F` | Cards and panels on dark backgrounds |
| `HM_TEAL` | `#009AA2` | Primary accent - H2 headings, underlines, borders, callout bars |
| `HM_LIGHT_GRN` | `#AAC9C2` | Muted text - secondary labels, cover metadata |
| `HM_OFF_WHITE` | `#F2F5F5` | Light backgrounds - alternating table rows, body sections |
| `HM_BLACK` | `#16171A` | Body text on light backgrounds |

---

## Logo Variants

All four logos live in `assets/` alongside this SKILL.md. All are 2000×507px PNG at native resolution with **transparent backgrounds**. Aspect ratio is approximately **3.95:1** - use this to calculate display dimensions.

| File | Use case |
|---|---|
| `hivemind-white.png` | Cover block (on dark green background) |
| `hivemind-on_dark_green.png` | Document header and body (on white/off-white background) |
| `hivemind-on_light_green.png` | Light green tinted panels |
| `hivemind-black.png` | Black text variant (use sparingly; dark green preferred on light bg) |

### Critical: Background Transparency

The source PNG files supplied by Hivemind have black backgrounds, not transparent ones. The assets bundled in this skill have already had their black backgrounds stripped. If you ever need to re-process raw logo PNGs after a brand refresh, strip the background first:

```python
from PIL import Image
import numpy as np

def strip_black_bg(src, dst, threshold=10):
    # threshold=30 for white/light-green logos
    # threshold=10 for dark-green logo (#0F2623 is dark - low threshold preserves it)
    img = Image.open(src).convert('RGBA')
    data = np.array(img)
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    mask = (r < threshold) & (g < threshold) & (b < threshold)
    data[mask, 3] = 0
    Image.fromarray(data).save(dst)
```

### Recommended display sizes (maintaining 3.95:1 ratio)

| Context | Width | Height |
|---|---|---|
| Cover block (docx) | 220px | 56px |
| Running header (docx) | 110px | 28px |
| Slide title area | 180px | 46px |

**Critical**: Always load logo bytes from `assets/` using `fs.readFileSync(path.join(__dirname, 'assets', 'hivemind-white.png'))`. The skill directory is the canonical source - do not rely on user-uploaded copies in subsequent sessions.

---

## Typography

- **Default font**: Arial (universally supported, matches brand toolkit fallback)
- **H1**: Arial, 28pt, bold, `HM_GREEN`, with teal bottom border rule
- **H2**: Arial, 24pt, bold, `HM_TEAL`
- **Body**: Arial, 22pt (11pt), `HM_BLACK`
- **Captions / footer**: Arial, 17-18pt, `#AAAAAA`
- **Cover title**: Arial, 34pt, bold, white
- **Cover subtitle/labels**: Arial, 20pt, `HM_LIGHT_GRN` (labels) / white (values)

---

## Docx Layout Patterns

The following are the validated, reusable patterns from the docx skill. Import what you need.

### 1 - Document Scaffold

Always set US Letter size with 1-inch margins. Override built-in heading styles with exact IDs.

```javascript
const doc = new Document({
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "0F2623" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "009AA2" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{ properties: { page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
  }}, headers: { default: hmHeader() }, footers: { default: hmFooter() }, children: [ /* content */ ] }]
});
```

---

### 2 - Running Header

Black logo left, right-aligned label, teal bottom rule.

```javascript
function hmHeader() {
  return new Header({ children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "009AA2", space: 4 } },
      spacing: { after: 80 },
      children: [
        new ImageRun({ data: fs.readFileSync('./assets/hivemind-black.png'), type: "png",
          transformation: { width: 110, height: 28 } }),
        new TextRun({ text: "\t[Document Title] · Confidential", font: "Arial", size: 17, color: "AAAAAA" }),
      ]
    })
  ]});
}
```

---

### 3 - Running Footer

Teal top rule, firm name left, page number right.

```javascript
function hmFooter() {
  return new Footer({ children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "009AA2", space: 4 } },
      spacing: { before: 80 },
      children: [
        new TextRun({ text: "Hivemind Capital - Confidential", font: "Arial", size: 17, color: "AAAAAA" }),
        new TextRun({ text: "\tPage ", font: "Arial", size: 17, color: "AAAAAA" }),
        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 17, color: "AAAAAA" }),
      ]
    })
  ]});
}
```

---

### 4 - Cover Block

Dark green full-width table with white logo, teal divider, metadata rows.

```javascript
function hmCoverBlock(title, subtitle, meta = {}) {
  // meta = { proposedBy, engagement, classification }
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: noBorders,
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: "0F2623", type: ShadingType.CLEAR },
      margins: { top: 480, bottom: 480, left: 560, right: 560 },
      children: [
        // Logo
        new Paragraph({ spacing: { before: 0, after: 240 }, children: [
          new ImageRun({ data: fs.readFileSync('./assets/hivemind-white.png'), type: "png",
            transformation: { width: 220, height: 56 } })
        ]}),
        // Eyebrow
        new Paragraph({ spacing: { before: 0, after: 120 }, children: [
          new TextRun({ text: subtitle, font: "Arial", size: 20, color: "AAC9C2" })
        ]}),
        // Main title
        new Paragraph({ spacing: { before: 0, after: 160 }, children: [
          new TextRun({ text: title, font: "Arial", size: 34, bold: true, color: "FFFFFF" })
        ]}),
        // Teal rule
        new Paragraph({ spacing: { before: 0, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "009AA2", space: 2 } },
          children: [new TextRun("")] }),
        // Meta rows - add as needed
        ...Object.entries(meta).map(([label, value]) =>
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [
            new TextRun({ text: `${label}  `, font: "Arial", size: 20, color: "AAC9C2" }),
            new TextRun({ text: value, font: "Arial", size: 20, color: "FFFFFF" }),
          ]})
        ),
      ]
    })]})],
  });
}
```

---

### 5 - Data / Summary Table

Dark green headers, alternating off-white/white rows, teal-tinted borders.

```javascript
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "C5D8D5" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function hmTableHeader(text) {
  return new TableCell({
    borders, shading: { fill: "0F2623", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 19, bold: true, color: "FFFFFF" })] })]
  });
}

function hmTableCell(text, isOdd, opts = {}) {
  const { color = "16171A", bold = false } = opts;
  return new TableCell({
    borders, shading: { fill: isOdd ? "F2F5F5" : "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 19, color, bold })] })]
  });
}
```

---

### 6 - Callout / Blockquote Box

Teal left bar, light teal-tinted background. Use for key questions, scope notes, caveats.

```javascript
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

function hmCallout(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [200, 9160],
    rows: [new TableRow({ children: [
      new TableCell({ borders: noBorders, width: { size: 200, type: WidthType.DXA },
        shading: { fill: "009AA2", type: ShadingType.CLEAR }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [new Paragraph({ children: [new TextRun("")] })] }),
      new TableCell({ borders: noBorders, width: { size: 9160, type: WidthType.DXA },
        shading: { fill: "E8F5F6", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 240, right: 240 },
        children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 21, color: "0F2623", italics: true })] })] }),
    ]})]
  });
}
```

---

### 7 - H1 / H2 Paragraph Helpers

```javascript
function hmH1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "009AA2", space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: "0F2623" })]
  });
}

function hmH2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: "009AA2" })]
  });
}

function hmBody(text) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "16171A" })]
  });
}
```

---

## Quick Reference - Which Logo When

```
Dark green cover / panel background  →  hivemind-white.png
White / off-white header             →  hivemind-black.png  
Dark green card (not full bleed)     →  hivemind-on_dark_green.png
Light green tinted panel             →  hivemind-on_light_green.png
```

---

## Checklist Before Delivering a Branded Document

- [ ] Logo loaded from `assets/` (not regenerated from SVG)
- [ ] Cover uses `hivemind-white.png` on `HM_GREEN` background
- [ ] Header uses `hivemind-black.png` at 110×28px
- [ ] All colors match palette exactly (no approximations)
- [ ] H1 has teal bottom rule; H2 is teal text
- [ ] Table headers use `HM_GREEN` fill, white text
- [ ] Footer has teal top rule, page number right-aligned
- [ ] Confidentiality line in footer or cover
- [ ] Document validated with `validate.py`
