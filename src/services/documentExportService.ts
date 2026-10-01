/**
 * Universal Document Export & Printing Service
 * Supports:
 * 1. Standardized A4 Print-to-PDF with Ministry Watermark & Exam Layout
 * 2. Standalone Single-File Offline HTML Export
 * 3. Formatted Markdown (.md) with KaTeX math preservation
 * 4. Structured JSON Data (.json) for offline backups
 * 5. Instant Rich Clipboard Copy
 */

export interface ExportableDocumentItem {
  id: string;
  title: string;
  category: string;
  subjectAr: string;
  branchAr?: string;
  documentType: 'cheat_sheet' | 'concept_booklet' | 'exam_essentials' | 'study_plan' | 'coding_tricks' | 'essay_report';
  summary: string;
  authorOrSource: string;
  pagesCountEstimate: number;
  sections: Array<{
    heading: string;
    subheading?: string;
    badge?: string;
    items: string[];
    latexFormulas?: string[];
    notes?: string;
  }>;
  officialMinistrySeal?: boolean;
}

export class DocumentExportService {
  /**
   * Trigger native browser print with standardized print styling
   */
  public printCurrentWindow(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  /**
   * Generate and trigger download of a self-contained, offline-ready HTML document
   */
  public exportAsStandaloneHtml(doc: ExportableDocumentItem): void {
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} - منظومة المخطط الذكي للثانوية العامة</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    :root {
      --primary: #064e3b;
      --primary-light: #ecfdf5;
      --accent: #2563eb;
      --text: #0f172a;
      --muted: #475569;
      --border: #cbd5e1;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'Cairo', sans-serif;
      background: #f8fafc;
      color: var(--text);
      line-height: 1.6;
      padding: 24px;
      direction: rtl;
    }
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid var(--primary);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      padding: 32px;
      position: relative;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .gov-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }
    .main-title {
      font-size: 24px;
      font-weight: 900;
      color: #022c22;
      margin: 6px 0;
    }
    .subtitle {
      font-size: 13px;
      color: var(--muted);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--primary-light);
      color: var(--primary);
      border: 1px solid var(--primary);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .section-card {
      background: #fafafa;
      border: 1px solid var(--border);
      border-right: 4px solid var(--primary);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #064e3b;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .list-item {
      font-size: 13.5px;
      margin-bottom: 8px;
      padding-right: 12px;
      position: relative;
    }
    .list-item::before {
      content: "•";
      position: absolute;
      right: 0;
      color: var(--primary);
      font-weight: bold;
    }
    .formula-box {
      direction: ltr;
      text-align: left;
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 10px 0;
      font-family: monospace;
      font-size: 13px;
      color: #1e293b;
    }
    .footer-bar {
      margin-top: 32px;
      border-top: 1px solid var(--border);
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--muted);
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    @media print {
      body { background: white; padding: 0; }
      .page-container { border: 1.5px solid var(--primary); box-shadow: none; padding: 15mm; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header-bar">
      <div>
        <div class="gov-title">جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني</div>
        <div class="subtitle">امتحانات شهادة إتمام الثانوية العامة - الشعبة العلمية (رياضيات)</div>
        <h1 class="main-title">${doc.title}</h1>
        <div class="subtitle">${doc.subjectAr} ${doc.branchAr ? `• ${doc.branchAr}` : ''} • المرجع: ${doc.authorOrSource}</div>
      </div>
      <div>
        <span class="badge">وثيقة A4 معتمدة</span>
      </div>
    </div>

    ${doc.sections
      .map(
        (sec) => `
      <div class="section-card">
        <div class="section-title">
          <span>${sec.heading}</span>
          ${sec.badge ? `<span class="badge">${sec.badge}</span>` : ''}
        </div>
        ${sec.subheading ? `<div class="subtitle" style="margin-bottom: 10px;">${sec.subheading}</div>` : ''}
        <div class="section-content">
          ${sec.items.map((item) => `<div class="list-item">${item}</div>`).join('')}
          ${
            sec.latexFormulas && sec.latexFormulas.length > 0
              ? sec.latexFormulas.map((f) => `<div class="formula-box">LaTeX Formula: ${f}</div>`).join('')
              : ''
          }
          ${sec.notes ? `<div style="font-size: 12px; color: #b45309; margin-top: 8px;">تنبيه فخ وزاري: ${sec.notes}</div>` : ''}
        </div>
      </div>
    `
      )
      .join('')}

    <div class="footer-bar">
      <span>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</span>
      <span>منظومة المخطط الذكي للثانوية العامة • الدفعة الرسمية 2026/2027</span>
      <span>كود الوثيقة: THN-${doc.id.toUpperCase()}</span>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ طباعة المستند (Print / PDF)</button>
</body>
</html>`;

    this.downloadBlob(htmlContent, `${doc.id}_document.html`, 'text/html;charset=utf-8');
  }

  /**
   * Export as Formatted Markdown (.md)
   */
  public exportAsMarkdown(doc: ExportableDocumentItem): void {
    let md = `# ${doc.title}\n`;
    md += `**المادة:** ${doc.subjectAr} ${doc.branchAr ? `(${doc.branchAr})` : ''}\n`;
    md += `**المصدر:** ${doc.authorOrSource}\n`;
    md += `**تاريخ الإصدار:** ${new Date().toLocaleDateString('ar-EG')}\n\n`;
    md += `> ${doc.summary}\n\n---\n\n`;

    doc.sections.forEach((sec, idx) => {
      md += `### ${idx + 1}. ${sec.heading} ${sec.badge ? `\`${sec.badge}\`` : ''}\n`;
      if (sec.subheading) md += `*${sec.subheading}*\n\n`;
      sec.items.forEach((item) => {
        md += `- ${item}\n`;
      });
      if (sec.latexFormulas && sec.latexFormulas.length > 0) {
        md += `\n**الصيغ الرياضية (LaTeX):**\n\`\`\`latex\n`;
        sec.latexFormulas.forEach((f) => {
          md += `${f}\n`;
        });
        md += `\`\`\`\n`;
      }
      if (sec.notes) {
        md += `\n⚠️ **تنبيه وزاري:** ${sec.notes}\n`;
      }
      md += `\n`;
    });

    md += `---\n*تم تصدير هذا المستند من منظومة المخطط الذكي للثانوية العامة المصرية.*`;

    this.downloadBlob(md, `${doc.id}_summary.md`, 'text/markdown;charset=utf-8');
  }

  /**
   * Export as structured JSON (.json)
   */
  public exportAsJson(doc: ExportableDocumentItem): void {
    const data = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      document: doc
    };
    const jsonStr = JSON.stringify(data, null, 2);
    this.downloadBlob(jsonStr, `${doc.id}_data.json`, 'application/json;charset=utf-8');
  }

  /**
   * Copy clean plain text representation to clipboard
   */
  public async copyToClipboard(doc: ExportableDocumentItem): Promise<boolean> {
    try {
      let text = `${doc.title}\n${doc.subjectAr}\n=====================================\n\n`;
      doc.sections.forEach((sec) => {
        text += `[${sec.heading}]\n`;
        sec.items.forEach((item) => {
          text += `• ${item}\n`;
        });
        if (sec.latexFormulas) {
          sec.latexFormulas.forEach((f) => {
            text += `  قانون: ${f}\n`;
          });
        }
        text += `\n`;
      });
      text += `\nالمرجع: ${doc.authorOrSource} • منظومة المخطط الذكي`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Clipboard copy error:', e);
      return false;
    }
  }

  private downloadBlob(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const documentExportService = new DocumentExportService();
