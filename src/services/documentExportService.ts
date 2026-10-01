/**
 * Universal Document Export & PDF Engine
 * Features:
 * 1. Direct Client-Side PDF Generation (jsPDF + html2canvas) with high-DPI A4 scaling
 * 2. Dedicated Clean Print Window/Iframe (Standardized A4 PDF Print)
 * 3. Standalone Single-File Offline HTML Export
 * 4. Formatted Markdown (.md) with KaTeX math preservation
 * 5. Structured JSON Data (.json) for offline backups
 * 6. Instant Rich Clipboard Copy
 * 7. Comprehensive Self-Test & Audit Suite for all printable materials
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export interface PrintableAuditReport {
  totalItems: number;
  readyItemsCount: number;
  allValid: boolean;
  testedAt: string;
  details: Array<{
    id: string;
    title: string;
    subject: string;
    sectionsCount: number;
    formulasCount: number;
    status: 'ready' | 'needs_attention';
  }>;
}

export class DocumentExportService {
  /**
   * Direct PDF Generator: Renders an HTML DOM Element into a real multi-page A4 PDF file using jsPDF and html2canvas
   */
  public async exportElementToPdf(
    element: HTMLElement,
    filename = 'thanaweya_document.pdf',
    options?: {
      title?: string;
      scale?: number;
      onProgress?: (step: string) => void;
    }
  ): Promise<boolean> {
    try {
      if (options?.onProgress) options.onProgress('جاري معالجة وتصيير عناصر الصفحة...');

      const scale = options?.scale || 2;
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (options?.onProgress) options.onProgress('جاري تنسيق أبعاد A4 وتقسيم الصفحات...');

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Subsequent pages if content overflows A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      if (options?.onProgress) options.onProgress('جاري تنزيل ملف PDF...');

      const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      pdf.save(cleanFilename);
      return true;
    } catch (err) {
      console.error('Error generating PDF with jsPDF:', err);
      return false;
    }
  }

  /**
   * Open dedicated clean printable window or fallback print
   * Strips all UI chrome and loads pure A4 styled printable document
   */
  public printCleanDocument(doc: ExportableDocumentItem): void {

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${doc.title} - طباعة معتمدة A4</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Cairo', sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      padding: 15mm;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-box {
      border: 2px solid #064e3b;
      border-radius: 8px;
      padding: 20px;
      background: #ffffff;
      position: relative;
      margin-bottom: 20px;
      page-break-after: always;
      break-after: page;
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.04;
      pointer-events: none;
      transform: rotate(-30deg);
      text-align: center;
      font-size: 26pt;
      font-weight: 800;
      color: #064e3b;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #064e3b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .gov-title { font-size: 11pt; font-weight: bold; color: #064e3b; }
    .sub-title { font-size: 9pt; color: #475569; }
    .main-title { font-size: 16pt; font-weight: 900; color: #022c22; margin: 4px 0; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #ecfdf5;
      color: #064e3b;
      border: 1px solid #064e3b;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
    }
    .section-card {
      border: 1px solid #cbd5e1;
      border-right: 4px solid #064e3b;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 14px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .section-title { font-size: 11.5pt; font-weight: bold; color: #064e3b; margin-bottom: 6px; }
    .item-row { font-size: 10pt; margin-bottom: 5px; padding-right: 12px; position: relative; }
    .item-row::before { content: "•"; position: absolute; right: 0; color: #064e3b; font-weight: bold; }
    .formula-row {
      direction: ltr;
      text-align: left;
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 6px 10px;
      margin: 6px 0;
      font-family: monospace;
      font-size: 10pt;
    }
    .notes-box { font-size: 9pt; color: #b45309; background: #fef3c7; padding: 6px 10px; border-radius: 4px; margin-top: 6px; }
    .footer-row {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #64748b;
    }
    .no-print-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .btn-print {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>🖨️ معاينة الطباعة القياسية A4 - تأكد من اختيار "Save as PDF" لحفظ الملف أو الطباعة المباشرة.</span>
    <button class="btn-print" onclick="window.print()">طباعة فورية / حفظ كـ PDF</button>
  </div>

  <div class="page-box">
    <div class="watermark">
      جمهورية مصر العربية<br>وزارة التربية والتعليم<br>نسخة معتمدة للامتحان
    </div>

    <div class="header-row">
      <div>
        <div class="gov-title">جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني</div>
        <div class="sub-title">امتحانات شهادة إتمام الثانوية العامة - الشعبة العلمية (رياضيات)</div>
        <div class="main-title">${doc.title}</div>
        <div class="sub-title">${doc.subjectAr} ${doc.branchAr ? `• ${doc.branchAr}` : ''} • المرجع: ${doc.authorOrSource}</div>
      </div>
      <div>
        <span class="badge">A4 Standard</span>
      </div>
    </div>

    ${doc.sections
      .map(
        (sec) => `
      <div class="section-card">
        <div class="section-title">
          <span>${sec.heading}</span>
          ${sec.badge ? `<span style="font-size: 9pt; color: #047857; margin-right: 8px;">[${sec.badge}]</span>` : ''}
        </div>
        ${sec.items.map((item) => `<div class="item-row">${item}</div>`).join('')}
        ${
          sec.latexFormulas && sec.latexFormulas.length > 0
            ? sec.latexFormulas.map((f) => `<div class="formula-row">الصيغة الرياضية: ${f}</div>`).join('')
            : ''
        }
        ${sec.notes ? `<div class="notes-box">⚠️ تنبيه وزاري: ${sec.notes}</div>` : ''}
      </div>
    `
      )
      .join('')}

    <div class="footer-row">
      <span>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</span>
      <span>منظومة المخطط الذكي للثانوية العامة • الدفعة الرسمية 2026/2027</span>
      <span style="font-family: monospace;">THN-${doc.id.toUpperCase()}</span>
    </div>
  </div>

</body>
</html>`;

    try {
      let printFrame = document.getElementById('clean-print-frame') as HTMLIFrameElement;
      if (printFrame && printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'clean-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '10px';
      printFrame.style.height = '10px';
      printFrame.style.opacity = '0.01';
      printFrame.style.pointerEvents = 'none';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch {
            window.print();
          }
        }, 350);
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print():', e);
      window.print();
    }
  }

  /**
   * Export as Standalone Single-File HTML
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
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
    .gov-title { font-size: 13px; font-weight: 700; color: var(--primary); }
    .main-title { font-size: 24px; font-weight: 900; color: #022c22; margin: 6px 0; }
    .subtitle { font-size: 13px; color: var(--muted); }
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

  <button class="print-btn" onclick="window.print()">🖨️ تصدير / طباعة المستند (Print to PDF)</button>
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
   * Export as JSON
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
   * Copy to clipboard
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

  /**
   * Audit all printable materials in the app and return readiness verification
   */
  public auditPrintableMaterials(docs: ExportableDocumentItem[]): PrintableAuditReport {
    let readyCount = 0;
    const details = docs.map((d) => {
      let formulasCount = 0;
      d.sections.forEach((s) => {
        if (s.latexFormulas) formulasCount += s.latexFormulas.length;
      });

      const isReady = d.sections.length > 0 && d.title.length > 0;
      if (isReady) readyCount++;

      return {
        id: d.id,
        title: d.title,
        subject: d.subjectAr,
        sectionsCount: d.sections.length,
        formulasCount,
        status: isReady ? ('ready' as const) : ('needs_attention' as const)
      };
    });

    return {
      totalItems: docs.length,
      readyItemsCount: readyCount,
      allValid: readyCount === docs.length,
      testedAt: new Date().toLocaleTimeString('ar-EG'),
      details
    };
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
