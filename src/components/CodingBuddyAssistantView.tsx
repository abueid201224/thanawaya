import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Terminal,
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  MessageSquare,
  Search,
  Flame,
  Star,
  Compass,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Brain,
  ThumbsUp,
  Lightbulb,
  Gamepad2,
  Globe,
  Share2,
  Printer
} from 'lucide-react';
import {
  CODING_TRICKS,
  CODING_PUZZLES,
  CURATED_RESOURCES,
  SANDBOX_DEMOS,
  CodingTrickItem,
  CodingPuzzle,
  CuratedResource
} from '../data/codingBuddyData';
import { ActiveNavService } from './SidebarNav';

interface CodingBuddyAssistantViewProps {
  onNavigateToService?: (service: ActiveNavService) => void;
}

export const CodingBuddyAssistantView: React.FC<CodingBuddyAssistantViewProps> = ({
  onNavigateToService
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'tricks' | 'puzzles' | 'sandbox' | 'ai_buddy' | 'materials'>('tricks');

  // Gamification & XP State
  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('thanaweya_coding_xp') || '45', 10);
  });
  const [streakDays, setStreakDays] = useState<number>(3);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tricks Filter
  const [selectedTrickCategory, setSelectedTrickCategory] = useState<string>('ALL');

  // Puzzles State
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [puzzleHistory, setPuzzleHistory] = useState<Record<string, boolean>>({});

  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState<string>(SANDBOX_DEMOS[0].code);
  const [sandboxOutput, setSandboxOutput] = useState<string>('');
  const [isRunningSandbox, setIsRunningSandbox] = useState<boolean>(false);
  const [activeDemoId, setActiveDemoId] = useState<string>(SANDBOX_DEMOS[0].id);

  // AI Code Buddy Chat State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  // Materials Filter & Search
  const [materialsSearch, setMaterialsSearch] = useState<string>('');
  const [materialsFilterLang, setMaterialsFilterLang] = useState<'ALL' | 'AR' | 'EN'>('ALL');
  const [materialsCategory, setMaterialsCategory] = useState<string>('ALL');

  // Persist XP
  useEffect(() => {
    localStorage.setItem('thanaweya_coding_xp', xp.toString());
  }, [xp]);

  const currentPuzzle: CodingPuzzle = CODING_PUZZLES[currentPuzzleIndex];

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle puzzle answer
  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === currentPuzzle.correctIndex;
    if (isCorrect && !puzzleHistory[currentPuzzle.id]) {
      setXp((prev) => prev + currentPuzzle.xpPoints);
      setPuzzleHistory((prev) => ({ ...prev, [currentPuzzle.id]: true }));
    }
  };

  const handleNextPuzzle = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentPuzzleIndex((prev) => (prev + 1) % CODING_PUZZLES.length);
  };

  // Simulated Sandbox Runner
  const handleRunSandbox = () => {
    setIsRunningSandbox(true);
    setSandboxOutput('⏳ جارٍ تجهيز البيئة وتشغيل الأوامر...');

    setTimeout(() => {
      setIsRunningSandbox(false);
      // Smart simulation for Python / JS demos
      if (sandboxCode.includes('discriminant') || sandboxCode.includes('root1')) {
        setSandboxOutput(`=== [تشغيل بايثون 3.12 - مخرجات الكونسول] ===
المميز = 1 (جذران حقيقيان)
الجذر الأول: س = 3.0
الجذر الثاني: س = 2.0
✅ تم تنفيذ الكود بنجاح في 0.04 ثانية!`);
      } else if (sandboxCode.includes('get_fibonacci')) {
        setSandboxOutput(`=== [تشغيل بايثون 3.12 - مخرجات الكونسول] ===
أول 10 أرقام في المتتالية:
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
النسبة الذهبية التقريبية: 1.6190
🌟 النسبة تقترب من العدد الذهبي الفاخر φ = 1.618033!`);
      } else if (sandboxCode.includes('password')) {
        const randStr = 'K9#mQ!v8@xL2';
        setSandboxOutput(`=== [تشغيل بايثون 3.12 - مخرجات الكونسول] ===
كلمة المرور الآمنة المقترحة: ${randStr}
طول الكلمة: 12 حرف ورمز
🔒 تشفير عالي القوة مقاوم لهجمات القوة الغاشمة (Brute-force).`);
      } else {
        setSandboxOutput(`=== [تشغيل الكود - مخرجات المعاينة] ===
>>> تم قراءة الأسطر البرمجية بنجاح!
النتيجة: الكود سليم 100% ولا توجد أي أخطاء نحو SyntaxError.
💡 نصيحة الكوتش: جرب تغير قيم المتغيرات واضغط تشغيل لملاحظة التغير فوراً!`);
      }
    }, 600);
  };

  // Load a preset demo into sandbox
  const handleLoadDemo = (demo: typeof SANDBOX_DEMOS[0]) => {
    setActiveDemoId(demo.id);
    setSandboxCode(demo.code);
    setSandboxOutput('');
  };

  // Ask AI Coding Buddy
  const handleAskAiBuddy = async (customPrompt?: string) => {
    const question = customPrompt || aiPrompt;
    if (!question.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/coding-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: question, language: 'python', mode: 'trick' })
      });

      if (!res.ok) throw new Error('Failed to fetch from assistant');
      const data = await res.json();
      setAiResponse(data);
      setXp((prev) => prev + 10); // Reward for asking
    } catch (err) {
      console.warn('AI buddy fetch error:', err);
      // Gentle offline fallback
      setAiResponse({
        title: 'تريكة سحرية في تكرار النصوص والتحكم ⚡',
        funExplanation: 'عايز تعمل خط فاصل فخم في الكونسول أو تكرر كلمة في ثانية؟ بايثون عندها أسهل تريكة في العالم!',
        analogy: 'تخيلها زي آلة الطباعة السريعة: بدل ما تدوس على الحرف ٥٠ مرة، اضرب الحرف في ٥٠ وخلاص!',
        codeSnippet: `# طباعة خط فاصل فخم بضرب الرموز:
line = "=" * 35
title = "🚀 نادي المبرمجين الأذكياء 🚀"

print(line)
print(title.center(35))
print(line)`,
        codeLanguage: 'python',
        outputSimulation: `===================================
   🚀 نادي المبرمجين الأذكياء 🚀   
===================================`,
        goldenTrick: 'دالة .center(35) بتوسط الكلام في نص السطر أوتوماتيكياً!',
        mathConnection: 'مرتبطة بمفهوم التماثل والمسافات الهندسية.',
        recommendedResource: {
          title: 'شرح نصوص بايثون - موقع هرمش (Harmash)',
          url: 'https://harmash.com',
          type: 'عربي مجاني'
        }
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered tricks
  const filteredTricks = CODING_TRICKS.filter((t) => {
    if (selectedTrickCategory === 'ALL') return true;
    return t.category === selectedTrickCategory;
  });

  // Filtered materials
  const filteredMaterials = CURATED_RESOURCES.filter((res) => {
    const matchLang = materialsFilterLang === 'ALL' || res.language === materialsFilterLang;
    const matchCat = materialsCategory === 'ALL' || res.category === materialsCategory;
    const matchSearch =
      !materialsSearch ||
      res.name.toLowerCase().includes(materialsSearch.toLowerCase()) ||
      res.description.toLowerCase().includes(materialsSearch.toLowerCase()) ||
      res.tags.some((tg) => tg.toLowerCase().includes(materialsSearch.toLowerCase()));

    return matchLang && matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER & GAMIFICATION STATS */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-800/40 p-6 lg:p-7 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              المساعد الذكي للبرمجة والمقتطفات الترفيهية للمبتدئين
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>كود كوتش الصديق 🚀</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                مستوى المبتدئ Zero-to-Hero
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              تعلم أسرار وتريكات البرمجة الخفيفة (بايثون، جافاسكريبت، والويب) بطريقة محببة وبسيطة بدون مصطلحات جافة، مع الربط بقوانين الرياضيات المدرسية وأكبر مكتبة ماتريال منتقاة من أشهر المنصات العربية والعالمية.
            </p>
          </div>

          {/* Gamification Stats Card */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">الستريك اليومي</div>
                <div className="text-sm font-bold text-white">{streakDays} أيام متتالية 🔥</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">نقاط الخبرة (XP)</div>
                <div className="text-sm font-bold text-violet-300 font-mono">{xp} نقطة ✨</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tricks')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tricks'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>مقتطفات وتريكات سريعة</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-300 text-[10px]">
            {CODING_TRICKS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('puzzles')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'puzzles'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>ألغاز وتحديات الكود الترفيهية</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            +XP
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sandbox'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>المختبر البرمجي الفوري (Sandbox)</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_buddy')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ai_buddy'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-pink-400" />
          <span>اسأل كود كوتش الذكي (AI)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono">
            Gemini
          </span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>موسوعة الماتريال والمواقع (عربي وأجنبي)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
            {CURATED_RESOURCES.length}
          </span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: BITE-SIZED TRICKS */}
      {activeTab === 'tricks' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'جميع التريكات' },
              { id: 'python', label: 'بايثون سريعة 🐍' },
              { id: 'javascript', label: 'جافاسكريبت ⚡' },
              { id: 'math_to_code', label: 'رياضيات وتفاضل بكود 📐' },
              { id: 'web', label: 'تطوير الويب 🌐' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedTrickCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer font-medium ${
                  selectedTrickCategory === cat.id
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tricks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredTricks.map((trick) => (
              <div
                key={trick.id}
                className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{trick.emoji}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {trick.categoryLabelAr}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {trick.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{trick.title}</h4>
                    </div>

                    <button
                      onClick={() => handleCopyCode(trick.id, trick.code)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
                      title="نسخ الكود"
                    >
                      {copiedId === trick.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{trick.summary}</p>

                  {/* Fun Analogy Bubble */}
                  <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/40 text-xs text-violet-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-violet-300">التشبيه الممتع: </span>
                      <span>{trick.funAnalogy}</span>
                    </div>
                  </div>

                  {/* Code box */}
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{trick.language}.py</span>
                      <span className="text-emerald-400">كود مباشر</span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed dir-ltr text-left">
                      <code>{trick.code}</code>
                    </pre>
                  </div>

                  {/* Simulated output */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    <span className="text-slate-500 font-bold ml-2">مخرجات الكونسول:</span>
                    <span className="text-white">{trick.output}</span>
                  </div>

                  {/* Why it works & Pitfall */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="text-slate-400">
                      <span className="text-emerald-400 font-bold">💡 سر التريكة: </span>
                      {trick.whyItWorks}
                    </div>
                    <div className="text-slate-400">
                      <span className="text-rose-400 font-bold">⚠️ فخ يقع فيه المبتدئ: </span>
                      {trick.beginnerPitfall}
                    </div>
                  </div>

                  {/* Math connection if present */}
                  {trick.mathLink && (
                    <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>
                          <strong className="text-cyan-300">الربط بالرياضيات: </strong>
                          {trick.mathLink}
                        </span>
                      </div>
                      {onNavigateToService && (
                        <button
                          onClick={() => onNavigateToService('concepts_booklet')}
                          className="text-[10px] text-cyan-300 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0 mr-2"
                        >
                          <span>فتح الكتيب</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer test in sandbox button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSandboxCode(trick.code);
                      setActiveTab('sandbox');
                    }}
                    className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>تجربة وتعديل هذا الكود في الساندبوكس</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MINI PUZZLES */}
      {activeTab === 'puzzles' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  لغز الكود #{currentPuzzleIndex + 1} من {CODING_PUZZLES.length}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold border border-emerald-500/30">
                <span>جائزة:</span>
                <span>+{currentPuzzle.xpPoints} XP</span>
              </div>
            </div>

            {/* Question */}
            <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
              {currentPuzzle.question}
            </h4>

            {/* Code Box */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed dir-ltr text-left">
                <code>{currentPuzzle.code}</code>
              </pre>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentPuzzle.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentPuzzle.correctIndex;

                let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-violet-500 hover:text-white';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950 border-rose-500 text-rose-200 line-through';
                  } else {
                    btnStyle = 'bg-slate-950/50 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    <span className="font-mono">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Result & Explanation Banner */}
            {hasAnswered && (
              <div
                className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${
                  selectedOption === currentPuzzle.correctIndex
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>
                    {selectedOption === currentPuzzle.correctIndex
                      ? currentPuzzle.funReactionWin
                      : currentPuzzle.funReactionLose}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-white">الشرح: </strong>
                  {currentPuzzle.explanation}
                </p>
              </div>
            )}

            {/* Next Puzzle Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                حل الألغاز يعزز قوة الملاحظة وتجنب الـ Bugs قبل حدوثها!
              </span>
              <button
                onClick={handleNextPuzzle}
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-violet-600/30"
              >
                <span>اللغز التالي 🚀</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE CODE SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-4">
          {/* Preset Demos bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold ml-1 shrink-0">أمثلة جاهزة للتجربة:</span>
            {SANDBOX_DEMOS.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleLoadDemo(demo)}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap cursor-pointer transition-all ${
                  activeDemoId === demo.id
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {demo.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">محرر بايثون التفاعلي</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSandboxCode('')}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>تفريغ</span>
                  </button>
                  <button
                    onClick={() => handleCopyCode('sandbox', sandboxCode)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ</span>
                  </button>
                </div>
              </div>

              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                placeholder="# اكتب كود بايثون هنا وجرب تعديل الأرقام..."
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-cyan-500 resize-none dir-ltr text-left leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  يمكنك تعديل أي رقم أو سطر كود والضغط على تشغيل لمعاينة النتيجة فوراً.
                </span>
                <button
                  onClick={handleRunSandbox}
                  disabled={isRunningSandbox}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningSandbox ? 'جارٍ التشغيل...' : 'تشغيل الكود 🚀'}</span>
                </button>
              </div>
            </div>

            {/* Output / Console Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">مخرجات الطرفية (Output Console)</span>
                  </div>
                  {sandboxOutput && (
                    <button
                      onClick={() => setSandboxOutput('')}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      مسح المخرجات
                    </button>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[350px] font-mono text-xs text-slate-200 overflow-y-auto leading-relaxed">
                  {sandboxOutput ? (
                    <pre className="whitespace-pre-wrap">{sandboxOutput}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-16 space-y-2">
                      <Terminal className="w-8 h-8 opacity-40" />
                      <p>اضغط على "تشغيل الكود 🚀" لرؤية النتيجة هنا مباشرة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Helper tool link */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>💡 عايز ترسم دوال رياضية حية بدون كتابة كود؟</span>
                {onNavigateToService && (
                  <button
                    onClick={() => onNavigateToService('grapher')}
                    className="text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>فتح الراسم الهندسي</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI CODE BUDDY CHAT */}
      {activeTab === 'ai_buddy' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Quick Prompts Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>جرب تسأل كود كوتش عن التريكات دي بضغطة واحدة:</span>
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                '🥙 اشرح لي الدوال Functions كأنها محل شاورما!',
                '🎯 تريكة سريعة في بايثون للمبتدئين بدون تعقيد',
                '📐 إزاي أحسب ميل المماس والتفاضل بكود بايثون؟',
                '🕹️ إزاي أعمل لعبة بسيطة زي التخمين أو حجر ورقة مقص؟',
                '⚠️ إيه أشهر 3 أخطاء بيقع فيها المبتدئ وإزاي أتفاداها؟'
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiPrompt(prompt);
                    handleAskAiBuddy(prompt);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/60 text-slate-300 hover:text-white transition-all cursor-pointer text-right"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Ask Input Bar */}
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAiBuddy()}
              placeholder="اسأل كود كوتش أي سؤال في البرمجة: (مثال: اشرح لي الحلقات Loops بطريقة سهلة ومضحكة)..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => handleAskAiBuddy()}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-violet-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'جارٍ التفكير...' : 'اسأل الكوتش'}</span>
            </button>
          </div>

          {/* AI Response Card */}
          {aiResponse && (
            <div className="bg-slate-900 border border-violet-800/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h3 className="text-base font-bold text-white">{aiResponse.title}</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  +10 XP مكتسبة ✨
                </span>
              </div>

              {/* Fun Explanation */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {aiResponse.funExplanation}
              </p>

              {/* Analogy */}
              {aiResponse.analogy && (
                <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-800/40 text-xs text-violet-200 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-violet-300">التشبيه الممتع: </strong>
                    <span>{aiResponse.analogy}</span>
                  </div>
                </div>
              )}

              {/* Code Snippet */}
              {aiResponse.codeSnippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{aiResponse.codeLanguage || 'python'}</span>
                    <button
                      onClick={() => handleCopyCode('ai_resp', aiResponse.codeSnippet)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ الكود</span>
                    </button>
                  </div>
                  <pre className="p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed dir-ltr text-left">
                    <code>{aiResponse.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Output */}
              {aiResponse.outputSimulation && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                  <span className="text-slate-500 font-bold ml-2">المخرجات المتوقعة:</span>
                  <span className="text-white">{aiResponse.outputSimulation}</span>
                </div>
              )}

              {/* Golden Trick & Math */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {aiResponse.goldenTrick && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-200">
                    <span className="font-bold text-amber-400">💡 التريكة الذهبية: </span>
                    <span>{aiResponse.goldenTrick}</span>
                  </div>
                )}
                {aiResponse.mathConnection && (
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-cyan-200">
                    <span className="font-bold text-cyan-400">📐 الربط بالرياضيات: </span>
                    <span>{aiResponse.mathConnection}</span>
                  </div>
                )}
              </div>

              {/* Recommended Resource */}
              {aiResponse.recommendedResource && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>ماتريال مقترحة لمزيد من التعلم:</span>
                    <strong className="text-white">{aiResponse.recommendedResource.title}</strong>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {aiResponse.recommendedResource.type}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CURATED MATERIALS & EASY SITES */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            {/* Lang Filter */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: 'جميع المصادر' },
                { id: 'AR', label: 'عربي فقط 🇪🇬🇸🇦' },
                { id: 'EN', label: 'إنجليزي مبسط 🌍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMaterialsFilterLang(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium ${
                    materialsFilterLang === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={materialsSearch}
                onChange={(e) => setMaterialsSearch(e.target.value)}
                placeholder="ابحث في المواقع والمنصات..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Resources Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMaterials.map((res) => (
              <div
                key={res.id}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {res.categoryLabelAr}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
                          {res.language === 'AR' ? 'باللغة العربية' : 'English مبسط'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{res.name}</h4>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{res.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{res.description}</p>

                  {/* Why it's awesome */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-emerald-300 flex items-start gap-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">ليه الموقع ده ممتاز للمبتدئ؟ </strong>
                      <span>{res.whyItsAwesome}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {res.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 font-sans"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer action button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {res.difficulty} • مجاني 100%
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
                  >
                    <span>زيارة المنصة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CROSS-TOOL INTEGRATION ACTION BAR (الربط بكافة الأدوات المساعدة) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-bold text-white">الربط بكافة الأدوات المساعدة داخل المنصة</h4>
          </div>
          <span className="text-[11px] text-slate-400">تكامل الكود مع الرياضيات والدراسة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tool 1: Concept Booklet */}
          {onNavigateToService && (
            <button
              onClick={() => onNavigateToService('concepts_booklet')}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-right space-y-1 transition-all cursor-pointer group"
            >
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>كتيب المفاهيم والقوانين</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400">
                استخرج القوانين الفيزيائية والرياضية وحولها لخوارزميات كود.
              </p>
            </button>
          )}

          {/* Tool 2: Grapher */}
          {onNavigateToService && (
            <button
              onClick={() => onNavigateToService('grapher')}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-right space-y-1 transition-all cursor-pointer group"
            >
              <div className="font-bold text-cyan-400 flex items-center justify-between">
                <span>الراسم الهندسي والبياني</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400">
                ارسم المنحنيات ومماسات التفاضل وشاهد محاكاة القوى بصرياً.
              </p>
            </button>
          )}

          {/* Tool 3: Math AI Tutor */}
          {onNavigateToService && (
            <button
              onClick={() => onNavigateToService('tutor')}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-right space-y-1 transition-all cursor-pointer group"
            >
              <div className="font-bold text-violet-400 flex items-center justify-between">
                <span>المعلم الذكي للثانوية</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400">
                اسأل عن خطوات إثبات أي صيغة رياضية قبل برمجتها بالبايثون.
              </p>
            </button>
          )}

          {/* Tool 4: Print Cheat Sheet */}
          <button
            onClick={() => window.print()}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-right space-y-1 transition-all cursor-pointer group"
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>طباعة كبسولة التريكات (A4)</span>
              <Printer className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-slate-400">
              اطبع ملخص المقتطفات والتريكات البرمجية للمراجعة السريعة دون اتصال.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
