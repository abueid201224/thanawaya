export type HighlightColor = 'yellow' | 'emerald' | 'cyan' | 'pink' | 'amber';

export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HighlightAnnotation {
  id: string;
  pageNumber: number;
  color: HighlightColor;
  rects: HighlightRect[];
  selectedText: string;
  createdAt: number;
  noteId?: string;
}

export type StickyNoteColor = 'yellow' | 'emerald' | 'cyan' | 'pink' | 'purple' | 'amber';

export interface StickyNoteAnnotation {
  id: string;
  pageNumber: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  color: StickyNoteColor;
  tag: string;
  content: string;
  isCollapsed: boolean;
  createdAt: number;
  linkedHighlightId?: string;
}

export interface BookletPageSection {
  id: string;
  title: string;
  latex?: string;
  description: string;
  bulletPoints?: string[];
  examAlert?: string;
  ruleBox?: {
    title: string;
    formula: string;
    notes?: string;
  };
}

export interface BookletPageData {
  pageNumber: number;
  subjectCode: 'CALCULUS' | 'STATICS' | 'DYNAMICS' | 'ALGEBRA' | 'SOLID_GEO' | 'GENERAL';
  subjectNameAr: string;
  branchAr: string;
  title: string;
  subtitle: string;
  sections: BookletPageSection[];
  footerNote: string;
}
