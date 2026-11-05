import React from 'react';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import { BookletPageData, HighlightAnnotation, StickyNoteAnnotation } from '../types/bookletAnnotations';
import { TRAINING_BOOKLET_PAGES } from '../data/conceptBookletPages';

export interface PrintSettings {
  scope: 'all' | 'current' | 'calculus' | 'statics' | 'dynamics' | 'algebra_geo' | 'appendix' | 'cards';
  currentPageNumber: number;
  includeHighlights: boolean;
  includeStickyNotes: boolean;
  includeStudentInfo: boolean;
  studentName?: string;
  seatingNumber?: string;
  schoolName?: string;
}

interface BookletStandardPrintDocumentProps {
  settings: PrintSettings;
  highlights: HighlightAnnotation[];
  stickyNotes: StickyNoteAnnotation[];
  cardsList?: any[];
}

export const BookletStandardPrintDocument: React.FC<BookletStandardPrintDocumentProps> = ({
  settings,
  highlights,
  stickyNotes,
  cardsList = []
}) => {
  // Determine which pages to render based on scope
  const targetPages: BookletPageData[] = React.useMemo(() => {
    switch (settings.scope) {
      case 'all':
        return TRAINING_BOOKLET_PAGES;
      case 'current':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === settings.currentPageNumber);
      case 'calculus':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === 2 || p.pageNumber === 3);
      case 'statics':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === 4 || p.pageNumber === 5);
      case 'dynamics':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === 6 || p.pageNumber === 7);
      case 'algebra_geo':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === 8 || p.pageNumber === 9);
      case 'appendix':
        return TRAINING_BOOKLET_PAGES.filter((p) => p.pageNumber === 10);
      case 'cards':
        return []; // handled in cards block
      default:
        return TRAINING_BOOKLET_PAGES;
    }
  }, [settings.scope, settings.currentPageNumber]);

  return (
    <div className="booklet-print-container">
      {/* 1. Render unofficial training pages with a visible provenance notice. */}
      {settings.scope !== 'cards' &&
        targetPages.map((page, pageIdx) => {
          const pageHighlights = settings.includeHighlights
            ? highlights.filter((h) => h.pageNumber === page.pageNumber)
            : [];
          const pageStickyNotes = settings.includeStickyNotes
            ? stickyNotes.filter((s) => s.pageNumber === page.pageNumber)
            : [];

          return (
            <div key={page.pageNumber} className="booklet-print-page">
              {/* Training-material header: intentionally avoids government branding. */}
              <div className="print-header-row">
                <div className="print-header-titles">
                  <div className="print-gov-title">
                    مادة تدريبية من التطبيق — غير صادرة عن وزارة التربية والتعليم
                  </div>
                  <div className="print-sub-gov-title">
                    تحقّق من الكتاب والمصادر الرسمية للعام الدراسي الحالي
                  </div>
                  <h1 className="print-main-title">{page.title}</h1>
                  <div className="print-branch-title">{page.subtitle}</div>
                </div>

                {/* Right / Left Info Badges */}
                <div className="print-header-meta">
                  <div className="print-page-badge">
                    <span className="badge-label">صفحة تدريبية</span>
                    <span className="badge-num">{page.pageNumber}</span>
                  </div>
                  <div className="print-code-tag">{page.subjectCode}</div>
                </div>
              </div>

              {/* Student Exam ID Header Box (if enabled) */}
              {settings.includeStudentInfo && (
                <div className="print-student-info-bar">
                  <div className="info-cell">
                    <strong>اسم الطالب:</strong> {settings.studentName || '................................................'}
                  </div>
                  <div className="info-cell">
                    <strong>رقم الجلوس:</strong> {settings.seatingNumber || '....................'}
                  </div>
                  <div className="info-cell">
                    <strong>اللجنة / المدرسة:</strong> {settings.schoolName || '................................................'}
                  </div>
                  <div className="info-cell">
                    <strong>الشعبة:</strong> علمي رياضة
                  </div>
                </div>
              )}

              {/* Main Content Sections */}
              <div className="print-sections-wrapper">
                {page.sections.map((section) => (
                  <div key={section.id} className="print-section-item avoid-page-break">
                    <h2 className="print-section-heading">{section.title}</h2>

                    {/* Formula Box */}
                    {section.latex && (
                      <div className="print-formula-box">
                        <MathRenderer latex={section.latex} block={true} className="print-math-latex" />
                      </div>
                    )}

                    {/* Description */}
                    <p className="print-section-desc">{section.description}</p>

                    {/* Bullet Points */}
                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="print-bullet-list">
                        {section.bulletPoints.map((bp, bpIdx) => (
                          <li key={bpIdx}>
                            <MixedTextRenderer text={bp} className="inline" />
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Rule Box */}
                    {section.ruleBox && (
                      <div className="print-rule-box avoid-page-break">
                        <div className="print-rule-title">★ {section.ruleBox.title}</div>
                        <div className="print-rule-formula">
                          <MathRenderer latex={section.ruleBox.formula} block={true} />
                        </div>
                        {section.ruleBox.notes && (
                          <div className="print-rule-notes">{section.ruleBox.notes}</div>
                        )}
                      </div>
                    )}

                    {/* Exam Alert */}
                    {section.examAlert && (
                      <div className="print-exam-alert avoid-page-break">
                        <span className="alert-badge">تنبيه امتحاني:</span>
                        <span>{section.examAlert}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Printed Sticky Notes Callouts (if included) */}
              {pageStickyNotes.length > 0 && (
                <div className="print-sticky-notes-container avoid-page-break">
                  <div className="print-sticky-notes-header">
                    <span>📌 ملاحظات واستدراكات الطالب المحفوظة (ملصقات الصفحة {page.pageNumber}):</span>
                  </div>
                  <div className="print-sticky-notes-grid">
                    {pageStickyNotes.map((note) => (
                      <div key={note.id} className={`print-sticky-card print-note-${note.color}`}>
                        <div className="note-card-tag">{note.tag}</div>
                        <div className="note-card-content">{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Printed Highlights Summary (if included) */}
              {pageHighlights.length > 0 && (
                <div className="print-highlights-container avoid-page-break">
                  <div className="print-highlights-header">
                    <span>🖍️ نصوص وقوانين قام الطالب بتظليلها في هذه الصفحة:</span>
                  </div>
                  <div className="print-highlights-list">
                    {pageHighlights.map((hl) => (
                      <div key={hl.id} className={`print-hl-pill hl-${hl.color}`}>
                        "{hl.selectedText}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standardized A4 Footer */}
              <div className="print-page-footer">
                <div className="footer-right">
                  <span>{page.footerNote}</span>
                </div>
                <div className="footer-center">نسخة تدريبية غير رسمية</div>
                <div className="footer-left">
                  <span>صفحة {page.pageNumber} من {targetPages.length > 1 ? 10 : page.pageNumber}</span>
                </div>
              </div>
            </div>
          );
        })}

      {/* 2. RENDER FORMULA CARDS BANK (IF CARDS SCOPE SELECTED) */}
      {settings.scope === 'cards' && (
        <div className="booklet-print-page">
          <div className="print-header-row">
            <div className="print-header-titles">
              <div className="print-gov-title">بطاقات مراجعة تدريبية — غير صادرة عن الوزارة</div>
              <h1 className="print-main-title">بنك القوانين والكبسولات الامتحانية الشاملة</h1>
              <div className="print-branch-title">مرجع القوانين السريعة للثانوية العامة (علمي رياضة)</div>
            </div>
          </div>

          <div className="print-cards-grid">
            {cardsList.map((card: any) => (
              <div key={card.id} className="print-card-item avoid-page-break">
                <div className="card-top-row">
                  <span className="card-subject">{card.subjectNameAr}</span>
                  <span className="card-chapter">{card.chapter}</span>
                </div>
                <h3 className="card-title">{card.title}</h3>
                <div className="print-formula-box">
                  <MathRenderer latex={card.latexFormula} block={true} />
                </div>
                <p className="card-desc">{card.explanation}</p>
                <div className="card-tip">
                  <strong>نصيحة الموجه: </strong>
                  <MixedTextRenderer text={card.examTip} className="inline" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
