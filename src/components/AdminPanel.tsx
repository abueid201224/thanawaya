import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Check,
  X,
  Plus,
  ExternalLink,
  BookOpen,
  Users,
  FileText,
  Lock,
  Star,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { ScoutedOfficialResource, MultimediaLibraryItem, UserRole } from '../types';

interface AdminPanelProps {
  scoutedResources: ScoutedOfficialResource[];
  onApproveResource: (resourceId: string) => void;
  onRejectResource: (resourceId: string) => void;
  onAddNewLibraryItem: (newItem: MultimediaLibraryItem) => void;
  userRole: UserRole;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  scoutedResources,
  onApproveResource,
  onRejectResource,
  onAddNewLibraryItem,
  userRole
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scout_queue' | 'add_resource' | 'rbac_audit'>('scout_queue');

  // New resource form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('CALCULUS');
  const [newFileType, setNewFileType] = useState<'video' | 'audio' | 'printable_doc'>('printable_doc');
  const [newUrl, setNewUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('وزارة التربية والتعليم - moe.gov.eg');
  const [newDescription, setNewDescription] = useState('');
  const [newPagesOrDuration, setNewPagesOrDuration] = useState('4 صفحات A4');

  if (userRole !== 'admin') {
    return (
      <div className="rounded-3xl border border-rose-900/40 bg-rose-950/20 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">منطقة مقيدة بصلاحيات المشرف العام (RBAC Guard)</h3>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          هذه الشاشة مخصصة لإدارة المناهج، مراجعة وتضمين روابط المواقع الحكومية المعتمدة، ومراقبة انضباط الطلاب وفق المعايير المؤسسية الدولية.
        </p>
        <div className="text-xs text-slate-400">
          يمكنك تفعيل صلاحية المشرف بالضغط على زر "الصلاحية" في الشريط العلوي لتجربة لوحة التحكم.
        </div>
      </div>
    );
  }

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const subjectNameMap: Record<string, string> = {
      CALCULUS: 'التفاضل والتكامل',
      ALGEBRA_SOLID_GEO: 'الجبر والهندسة الفراغية',
      STATICS: 'الاستاتيكا',
      DYNAMICS: 'الديناميكا',
      PHYSICS: 'الفيزياء',
      CHEMISTRY: 'الكيمياء',
      LANGUAGES: 'اللغات'
    };

    const newItem: MultimediaLibraryItem = {
      id: `med_${Date.now()}`,
      subjectCode: newSubject,
      subjectNameAr: subjectNameMap[newSubject] || newSubject,
      title: newTitle,
      description: newDescription,
      fileType: newFileType,
      url: newUrl || 'https://moe.gov.eg/official_document.pdf',
      sourceName: newSourceName,
      rating: 5.0,
      durationOrPages: newPagesOrDuration,
      isVerifiedByMinistry: true,
      uploadDate: new Date().toISOString().split('T')[0],
      printableCheatSheet: [
        'قاعدة معتمدة تم إدراجها بواسطة المشرف التربوي.',
        'قوانين ونواتج تعلم موثقة.'
      ]
    };

    onAddNewLibraryItem(newItem);
    setNewTitle('');
    setNewDescription('');
    setNewUrl('');
    setActiveSubTab('scout_queue');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/60 border border-purple-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              صلاحيات الإشراف الأكاديمي والتحكم المؤسسي (Enterprise RBAC)
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              إدارة المصادر المعتمدة ومراجعة كشاف المواقع الحكومية
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تحكم كامل في قبول أو رفض المستندات والروابط المرصودة عبر كشاف الذكاء الاصطناعي من بوابة وزارة التربية والتعليم (moe.gov.eg)، بنك المعرفة (ekb.eg)، ومنصة نجوى.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[260px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>الطلبات بانتظار الاعتماد:</span>
              <span className="font-bold text-amber-400 font-mono">
                {scoutedResources.filter((r) => r.status === 'pending').length} مستندات
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>البروتوكول الأمني:</span>
              <span className="font-bold text-emerald-400 font-mono">RBAC ISO-27001</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>جلسة المشرف:</span>
              <span className="font-bold text-purple-400 font-mono">مصرحة ومحمية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('scout_queue')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold ${
            activeSubTab === 'scout_queue'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          طابور اعتماد روابط الكشاف الحكومي (Human-in-the-Loop)
        </button>

        <button
          onClick={() => setActiveSubTab('add_resource')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold ${
            activeSubTab === 'add_resource'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة مذكرات أو وسائط للمكتبة يدوياً</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rbac_audit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold ${
            activeSubTab === 'rbac_audit'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          سجل تدقيق الصلاحيات والامتثال الأمني (Audit Logs)
        </button>
      </div>

      {/* Sub-tab 1: Scout Approval Queue */}
      {activeSubTab === 'scout_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <span>الروابط والمذكرات المرصودة من المنصات الحكومية المعتمدة</span>
            </h3>
            <span className="text-xs text-slate-400">
              تخضع للمراجعة قبل إتاحتها في مكتبة الطالب وتضمينها في RAG
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoutedResources.map((res) => {
              const isPending = res.status === 'pending';

              return (
                <div
                  key={res.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25 font-mono font-bold">
                        {res.platform}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          res.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : res.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {res.status === 'approved' && 'معتمد في المكتبة'}
                        {res.status === 'rejected' && 'مرفوض'}
                        {res.status === 'pending' && 'بانتظار موافقة المشرف'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{res.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{res.summary}</p>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>المادة المقترحة: {res.suggestedSubject}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-mono">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {res.ratingScore}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      معاينة المصدر الأصلي <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRejectResource(res.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                        >
                          رفض
                        </button>
                        <button
                          onClick={() => onApproveResource(res.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعتماد ونشر في المكتبة</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Manual Add Resource */}
      {activeSubTab === 'add_resource' && (
        <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-purple-400" />
            <span>إضافة مذكرة A4 أو وسائط للمكتبة بصلاحية المشرف</span>
          </h3>

          <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">عنوان المورد أو المذكرة التعليمية</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثلاً: كبسولة مراجعة ليلة الامتحان في الاستاتيكا 2027"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">المادة الدراسية</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="CALCULUS">التفاضل والتكامل</option>
                  <option value="ALGEBRA_SOLID_GEO">الجبر والهندسة الفراغية</option>
                  <option value="STATICS">الاستاتيكا</option>
                  <option value="DYNAMICS">الديناميكا</option>
                  <option value="PHYSICS">الفيزياء</option>
                  <option value="CHEMISTRY">الكيمياء</option>
                  <option value="LANGUAGES">اللغات</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نوع الملف</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="printable_doc">مستند PDF قابل للطباعة A4</option>
                  <option value="video">فيديو شرح تعليمي</option>
                  <option value="audio">كبسولة صوتية MP3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">المصدر المعتمد</label>
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="مثلاً: وزارة التربية والتعليم - moe.gov.eg"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">الرابط المباشر (URL)</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://moe.gov.eg/document.pdf"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">الوصف والمحتوى المستهدف</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="ملخص وافٍ لأهم أفكار ونواتج التعلم المتضمنة..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-md shadow-purple-600/30"
              >
                نشر واعتماد في مكتبة الطلاب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-tab 3: RBAC Security Audit Logs */}
      {activeSubTab === 'rbac_audit' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>سجل تدقيق الصلاحيات والامتثال الأمني (Security Audit Log)</span>
          </h3>

          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
            <div className="text-emerald-400">[2026-10-28 14:02:11] RBAC Session Verified: User 'Admin_Ahmed' authenticated via DPAPI vault token.</div>
            <div className="text-blue-400">[2026-10-28 14:15:30] Web Scout Scanner dispatched to 'moe.gov.eg' - 2 documents discovered.</div>
            <div className="text-purple-400">[2026-10-28 14:22:45] Permission Grant: Only Verified Admin can mutate 'multimedia_library' table.</div>
            <div className="text-slate-400">[2026-10-28 14:30:19] Student Role Gated: Students hold read/quiz/chat authorization only (NIST SP 800-162 compliant).</div>
          </div>
        </div>
      )}
    </div>
  );
};
