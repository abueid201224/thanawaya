import {
  DailyScheduleSlot,
  MultimediaLibraryItem,
  ExamEssential,
  SubjectProgress,
  DisciplineMetrics,
  BreakGuidance,
  ScoutedResourceCandidate,
  CurriculumSourceReference,
  UserProfile
} from '../types';

export const curriculumSourceReferences: CurriculumSourceReference[] = [
  {
    id: 'ministry_learning_outcomes',
    title: 'مخرجات التعلم وكيف تذاكر للصف الثالث الثانوي',
    url: 'https://moe.gov.eg/ar/learning-outcomes/',
    publisher: 'وزارة التربية والتعليم والتعليم الفني',
    yearScope: 'الصفحة لا تحدد سنة دراسية للمحتوى المرتبط',
    limitation: 'بوابة رسمية عامة؛ يجب فحص سنة كل ملف مرتبط بها قبل اعتباره مطابقاً لمنهج 2026/2027.'
  },
  {
    id: 'ministry_e_library_2026_27',
    title: 'المكتبة الإلكترونية للكتب الدراسية — الثانوي العام',
    url: 'https://ellibrary.moe.gov.eg/books/Books-sec/',
    publisher: 'وزارة التربية والتعليم والتعليم الفني',
    yearScope: 'البوابة معنونة 2026-2027؛ لم يتسنّ التحقق من فهرس مواد الصف الثالث من النص المتاح',
    limitation: 'صفحة اختيار الصف والمادة؛ تحقّق من الكتاب وفهرسه وسنة طباعته قبل ربط أي موضوع بها.'
  }
];

export const initialUser: UserProfile = {
  id: 'local_guest',
  name: 'طالب',
  email: '',
  role: 'student',
  seatingNumber: '',
  school: '',
  governorate: '',
  targetFaculty: '',
  dailyStreak: 0,
  disciplineScore: 0,
  preferredStudyHours: 2,
};

export const initialDailySchedule: DailyScheduleSlot[] = [
  {
    id: 'slot_1',
    timeStart: '15:30',
    timeEnd: '17:00',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    topic: 'تطبيقات القيم العظمى والصغرى والمعدلات الزمنية المرتبطة',
    slotType: 'study',
    priority: 'critical',
    isCompleted: false,
    aiPriorityReason: 'مقترح تدريب عام؛ لم تُحسب أوزان امتحانية أو تكرارات موثقة لهذا الدرس.',
    examEssentialKey: 'ess_calc_1'
  },
  {
    id: 'slot_2',
    timeStart: '17:00',
    timeEnd: '17:20',
    subjectCode: 'BREAK',
    subjectNameAr: 'استراحة وتجديد النشاط',
    topic: 'راحة بومودورو + تقنية الاسترجاع النشط الفوري (Active Recall)',
    slotType: 'break',
    priority: 'medium',
    isCompleted: false,
  },
  {
    id: 'slot_3',
    timeStart: '17:20',
    timeEnd: '18:45',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    topic: 'الاتزان العام وتطبيقات القضبان والسلالم المرتكزة على حائط أملس وأرض خشنة',
    slotType: 'practice',
    priority: 'high',
    isCompleted: false,
    aiPriorityReason: 'مقترح تدريب عام: حل مسائل متنوعة لتثبيت معادلات الاتزان وحساب العزوم.',
    examEssentialKey: 'ess_stat_1'
  },
  {
    id: 'slot_4',
    timeStart: '18:45',
    timeEnd: '19:30',
    subjectCode: 'BREAK',
    subjectNameAr: 'صلاة المغرب واستراحة عشاء وتحفيز ذهني',
    topic: 'تغذية صحية وشرب ماء وتمارين استرخاء وتنفس عميق',
    slotType: 'break',
    priority: 'medium',
    isCompleted: false,
  },
  {
    id: 'slot_5',
    timeStart: '19:30',
    timeEnd: '21:00',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    topic: 'قوانين كيرشوف المعقدة وحساب التيارات في الدوائر ثلاثية الحلقات',
    slotType: 'study',
    priority: 'high',
    isCompleted: false,
    aiPriorityReason: 'فهم وتطبيق: ضرورة التدرب على استخدام الآلة الحاسبة لحل معادلات كيرشوف الثلاثية لتوفير الوقت.',
    examEssentialKey: 'ess_phys_1'
  },
  {
    id: 'slot_6',
    timeStart: '21:10',
    timeEnd: '22:15',
    subjectCode: 'DYNAMICS',
    subjectNameAr: 'الديناميكا',
    topic: 'البكرات البسيطة والمصاعد وحركة جسمين على مستوى أملس وخشن',
    slotType: 'revision',
    priority: 'critical',
    isCompleted: false,
    aiPriorityReason: 'مراجعة تدريبية عامة؛ لا توجد هنا بيانات موثقة عن تكرار هذا الموضوع في الامتحانات.',
    examEssentialKey: 'ess_dyn_1'
  }
];

export const initialExamEssentials: ExamEssential[] = [
  {
    id: 'ess_calc_1',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    topic: 'المعدلات الزمنية المرتبطة وتطبيقات القيم العظمى والصغرى',
    importanceRating: 0,
    pastExamOccurrences: [],
    coreConcept: 'عند إيجاد أكبر مساحة أو أصغر تكلفة، اجعل الدالة في متغير واحد فقط باستخدام العلاقة المساعدة، ثم ساوي المشتقة الأولى بالصفر (دَ(س) = 0)، وتأكد باختبار المشتقة الثانية أن دً(س) < 0 للعظمى و دً(س) > 0 للصغرى.',
    examTrapWarning: 'فخ شهير: ينسى الطالب التحقق من مجال المسألة الهندسي (س > 0 ومحدود بأبعاد الشكل)، مما يؤدي لاختيار نقطة حرجة خارج النطاق الفعلي!',
    sampleExamQuestion: 'نافذة على شكل مستطيل يعلوه نصف دائرة ينطبق قطرها على أحد أبعاده، فإذا كان محيط النافذة الكلي ٦ أمتار، أوجد أبعاد المستطيل التي تجعل مساحة سطح النافذة أكبر ما يمكن.',
    stepByStepSolution: '1. نفرض بعدي المستطيل 2س و ص، حيث نصف قطر الدائرة س.\n2. المحيط ح = 2ص + 2س + π س = 6 => ص = (6 - (2+π)س) / 2.\n3. المساحة م = مساحة المستطيل + مساحة نصف الدائرة = 2س ص + (1/2) π س².\n4. نعوض عن ص بدلالة س فتصبح م = 6س - (2 + π/2)س².\n5. نشتق بالنسبة لـ س: دم/دس = 6 - (4 + π)س = 0 => س = 6 / (4 + π) متر.\n6. نتحقق من أن د²م/دس² = -(4 + π) < 0، إذن المساحة عظمى مطلقة عند هذه الأبعاد.'
  },
  {
    id: 'ess_stat_1',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    topic: 'اتزان قضيب أو سلم منتظم مستند على حائط رأسي أملس وأرض أفقية خشنة',
    importanceRating: 0,
    pastExamOccurrences: [],
    coreConcept: 'شروط الاتزان العام: مجموع القوى الأفقية = 0 (س = 0)، مجموع القوى الرأسية = 0 (ص = 0)، ومجموع العزوم حول أي نقطة (يُفضل نقطة الاتصال مع الأرض لإلغاء رد الفعل وقوة الاحتكاك) = 0.',
    examTrapWarning: 'فخ شهير: عدم الانتباه لما إذا كان السلم "على وشك الانزلاق" (استخدام ح = م_س × ر) أو "متزناً فقط" (ح ≤ م_س × ر)، كما يخطئ الطلاب في إشارات العزوم بالنسبة لاتجاه دوران عقارب الساعة.',
    sampleExamQuestion: 'سلم منتظم وزنه ٢٠ ثقل كجم يستند بطرفه العلوي على حائط رأسي أملس وبطرفه السفلي على أرض أفقية خشنة معامل الاحتكاك بينها وبين السلم ٠٫٥. إذا كان السلم يميل بزاوية ٤٥° على الأفقي، أثبت أن رجلاً وزنه ٦٠ ث.كجم لا يمكنه الصعود لأعلى قمة السلم دون أن ينزلق.',
    stepByStepSolution: '1. رد الفعل عند الحائط الأملس ر_2 أفقي، ورد الفعل عند الأرض ر_1 رأسي لأعلى وقوة الاحتكاك ح أفقية للداخل.\n2. من الاتزان الرأسي: ر_1 = وزن السلم + وزن الرجل = 20 + 60 = 80 ث.كجم.\n3. أقصى قوة احتكاك سكوني نهائي: ح_س = م_س × ر_1 = 0.5 × 80 = 40 ث.كجم.\n4. بأخذ العزوم حول النقطة السفلية (أ): ر_2 × ل جا(45) - 20 × (ل/2) جتا(45) - 60 × ف جتا(45) = 0.\n5. عند وصول الرجل للقمة (ف = ل): ر_2 = 10 + 60 = 70 ث.كجم. ولكن من الاتزان الأفقي ر_2 = ح، فيلزم أن تكون ح = 70 ث.كجم وهي أكبر من ح_س (40)، إذن سينزلق السلم حتماً قبل الوصول للقمة.'
  },
  {
    id: 'ess_phys_1',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    topic: 'قوانين كيرشوف وحساب القوة الدافعة الكهربية وفرق الجهد بين نقطتين',
    importanceRating: 0,
    pastExamOccurrences: [],
    coreConcept: 'القانون الأول (حفظ الشحنة): مجموع التيارات الداخلة = مجموع التيارات الخارجة عند أي عقدة. القانون الثاني (حفظ الطاقة): المجموع الجبري للقوى الدافعة الكهربية في أي مسار مغلق = المجموع الجبري لفروق الجهد (ΣVB = ΣIR).',
    examTrapWarning: 'فخ شهير: إهمال المقاومة الداخلية للبطارية (r)، أو الخلط في إشارة الجهد عند الانتقال بين نقطتين مفتوحتين (مسار مفتوح V_A - V_B).',
    sampleExamQuestion: 'في دائرة كيرشوف الموضحة، احسب فرق الجهد بين النقطتين أ و ب، والقدرة المستنفذة في الدائرة.',
    stepByStepSolution: '1. تطبيق قانون كيرشوف الأول عند العقدة الرئيسية: ت1 + ت2 = ت3.\n2. اختيار اتجاه دوران محدد لكل حلقة وكتابة معادلات الجهد بدقة.\n3. القدرة المستنفذة = مجموع القدرة المستهلكة في المقاومات الخارجية والداخلية (Σ I² R) + القدرة المستهلكة في شحن البطاريات التي في حالة شحن (I × VB).'
  },
  {
    id: 'ess_dyn_1',
    subjectCode: 'DYNAMICS',
    subjectNameAr: 'الديناميكا',
    topic: 'حركة الأجسام على المستويات المائلة والمصاعد ومبدأ الشغل والطاقة',
    importanceRating: 0,
    pastExamOccurrences: [],
    coreConcept: 'مبدأ الشغل والطاقة: التغير في طاقة الحركة = مجموع الشغل المبذول من جميع القوى المؤثرة (ط - ط₀ = ش). في المصاعد: قراءة الميزان (الوزن الظاهري) ر = ك(د + جـ) عند الصعود بعجلة، و ر = ك(د - جـ) عند الهبوط بعجلة.',
    examTrapWarning: 'فخ شهير: نسيان تحويل الكتلة والوزن بين وحدة الكيلوجرام والنيوتن (الضرب في عجلة الجاذبية 9.8 م/ث²).',
    sampleExamQuestion: 'ميزان زنبركي مثبت في سقف مصعد يحمل جسماً كتلته ك كجم، فإذا كانت قراءة الميزان أثناء الصعود بعجلة منتظمة جـ هي ٤٩ نيوتن، وكانت قراءته أثناء الهبوط بنفس العجلة جـ هي ٣٩٫٢ نيوتن، أوجد كتلة الجسم ك والعجلة جـ.',
    stepByStepSolution: '1. أثناء الصعود: ر1 = ك(د + جـ) = 49 نيوتن.\n2. أثناء الهبوط: ر2 = ك(د - جـ) = 39.2 نيوتن.\n3. بجمع المعادلتين: 2 ك د = 49 + 39.2 = 88.2 => ك = 88.2 / (2 × 9.8) = 4.5 كجم.\n4. بالطرح: 2 ك جـ = 49 - 39.2 = 9.8 => جـ = 9.8 / (2 × 4.5) = 1.09 م/ث².'
  }
];

export const initialMultimediaLibrary: MultimediaLibraryItem[] = [
  {
    id: 'med_calc_03',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'مراجعة أولية: قوانين مختارة في التفاضل والتكامل',
    description: 'ورقة تدريبية داخل التطبيق. لا تدّعي الشمول أو الاعتماد، ولم تُراجع بعد مقابل منهج 2026/2027.',
    fileType: 'printable_doc',
    url: '',
    sourceName: 'محتوى تدريبي داخلي — المصدر الرسمي غير مرفق',
    durationOrPages: 'ورقة تدريبية',
    isPrintable: true,
    printableCheatSheet: [
      'قاعدة السلسلة: دص/دس = (دص/دع) × (دع/دس).',
      'مشتقات الدوال المثلثية: [جا س]َ = جتا س ، [جتا س]َ = -جا س ، [ظا س]َ = قا² س ، [ظتا س]َ = -قتا² س ، [قا س]َ = قا س ظا س ، [قتا س]َ = -قتا س ظتا س.',
      'مشتقات الدوال الأسية واللوغاريتمية: [هـ^س]َ = هـ^س ، [أ^س]َ = أ^س لو_هـ(أ) ، [لو_هـ(س)]َ = 1/س.',
      'تكامل البسط مشتقة المقام: ∫ (دَ(س) / د(س)) دس = لو_هـ |د(س)| + ث.',
      'التكامل بالتجزيء: ∫ ص د ع = ص ع - ∫ ع د ص.',
      'حجم الجسم الدوراني حول محور السينات: ح = π ∫ (ص)² دس.'
    ],
    sourceStatus: 'unverified'
  },
  {
    id: 'med_stat_02',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    title: 'مراجعة أولية: قوانين مختارة في الاستاتيكا',
    description: 'ورقة تدريبية داخل التطبيق. لا تدّعي الشمول أو الاعتماد، ولم تُراجع بعد مقابل منهج 2026/2027.',
    fileType: 'printable_doc',
    url: '',
    sourceName: 'محتوى تدريبي داخلي — المصدر الرسمي غير مرفق',
    durationOrPages: 'ورقة تدريبية',
    isPrintable: true,
    printableCheatSheet: [
      'قوة الاحتكاك السكوني النهائي: ح_س = م_س × ر ، حيث م_س = ظا(ل) و ل هي زاوية الاحتكاك.',
      'رد الفعل الكلي المحصل: ر_ش = ر √(1 + م_س²) = ر قا(ل).',
      'عزم قوة حول نقطة في الفراغ: جـ_و = ر × ق = محدد المتجهات (س، ص، ع).',
      'طول العمود الساقط من نقطة العزم على خط عمل القوة: ل = |جـ_و| / |ق|.',
      'شروط الاتزان العام: Σ ق_س = 0 ، Σ ق_ص = 0 ، Σ جـ حول أي نقطة = 0.',
      'معيار عزم الازدواج: جـ = ± إحدى القوتين × البعد العمودي بينهما.'
    ],
    sourceStatus: 'unverified'
  },
  {
    id: 'med_phys_02',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    title: 'مراجعة أولية: قوانين مختارة في الفيزياء',
    description: 'ورقة تدريبية داخل التطبيق. لا تدّعي الشمول أو الاعتماد، ولم تُراجع بعد مقابل منهج 2026/2027.',
    fileType: 'printable_doc',
    url: '',
    sourceName: 'محتوى تدريبي داخلي — المصدر الرسمي غير مرفق',
    durationOrPages: 'ورقة تدريبية',
    isPrintable: true,
    printableCheatSheet: [
      'المقاومة النوعية والتوصيلية: R = ρ_e (L / A) ، σ = 1 / ρ_e.',
      'قانون أوم للدائرة المغلقة: I = V_B / (R_eq + r).',
      'كثافة الفيض المغناطيسي لسلك مستقيم: B = (μ I) / (2 π d) ، وللملف الدائري: B = (μ N I) / (2 r).',
      'القوة المغناطيسية: F = B I L جا(θ) ، وعزم الازدواج المغناطيسي: τ = B I A N جتا(θ).',
      'قانون فاراداي للحث: emf = -N (ΔΦ_m / Δt) ، والدينامو: emf_inst = N B A ω جا(θ).',
      'طاقة الفوتون وظاهرة كومتون: E = h ν = h c / λ ، كمية حركة الفوتون: p_L = h / λ.'
    ],
    sourceStatus: 'unverified'
  }
];

export const initialSubjectProgress: SubjectProgress[] = [
  {
    subjectCode: 'CALCULUS',
    nameAr: 'التفاضل والتكامل',
    category: 'رياضيات بحتة',
    totalChapters: 4,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#2563EB',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'ALGEBRA_SOLID_GEO',
    nameAr: 'الجبر والهندسة الفراغية',
    category: 'رياضيات بحتة',
    totalChapters: 4,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#7C3AED',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'STATICS',
    nameAr: 'الاستاتيكا',
    category: 'رياضيات تطبيقية',
    totalChapters: 6,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#D97706',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'DYNAMICS',
    nameAr: 'الديناميكا',
    category: 'رياضيات تطبيقية',
    totalChapters: 4,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#EA580C',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'PHYSICS',
    nameAr: 'الفيزياء',
    category: 'علوم فيزيائية',
    totalChapters: 8,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#059669',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'CHEMISTRY',
    nameAr: 'الكيمياء',
    category: 'علوم فيزيائية',
    totalChapters: 5,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#0891B2',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  },
  {
    subjectCode: 'LANGUAGES',
    nameAr: 'اللغات (عربي / إنجليزي)',
    category: 'لغات',
    totalChapters: 6,
    completedChapters: 0,
    quizzesTaken: 0,
    averageScore: 0,
    masteryPercentage: 0,
    colorHex: '#DC2626',
    lastStudiedDate: 'غير محدد',
    learningOutcomesTotal: 0,
    learningOutcomesMastered: 0
  }
];

export const initialDisciplineMetrics: DisciplineMetrics = {
  totalStudyMinutesToday: 0,
  targetStudyMinutesToday: 120,
  weeklyAttendancePercent: 0,
  homeworkCompleted: 0,
  homeworkTotal: 0,
  currentStreakDays: 0,
  bestStreakDays: 0,
  disciplineScore: 0,
  badgesEarned: []
};

export const breakGuidances: BreakGuidance[] = [
  {
    id: 'bg_1',
    title: 'استراحة الاستدعاء النشط (Active Recall Refresh)',
    scientificMethod: 'الاسترجاع الذهني بدون النظر للكتاب',
    motivationalAdvice: 'أنت الآن تبني مسارات عصبية قوية في دماغك! أغمض عينيك لمدة دقيقتين واسترجع في ذهنك القوانين الثلاثة الأساسية التي ذاكرتها للتو دون فتح الورقة.',
    recommendedPhysicalAction: 'قف واشرب كوباً كبيراً من الماء البارد، وقم بتمارين تمديد الكتف والرقبة لمدة 3 دقائق.',
    durationMinutes: 15
  },
  {
    id: 'bg_2',
    title: 'تقنية فاينمان للشرح المبسط (Feynman Technique)',
    scientificMethod: 'تبسيط المفهوم المعقد كأنك تشرحه لشخص مبتدئ',
    motivationalAdvice: 'العالم ريتشارد فاينمان الحائز على نوبل أثبت: إذا استطعت شرح قانون كيرشوف أو الاتزان العام بكلماتك البسيطة في دقيقة واحدة، فقد امتلكت ناصية المفهوم للأبد!',
    recommendedPhysicalAction: 'تحدث بصوت مسموع واشرح الفكرة لغرفتك أو اكتب ملخصاً في سطرين فقط على ورقة جانبية.',
    durationMinutes: 10
  },
  {
    id: 'bg_3',
    title: 'استراحة محاربي الثانوية العامة والتنفس الصندوقي',
    scientificMethod: 'تقنية التنفس الرباعي لخفض هرمون الكورتيزول',
    motivationalAdvice: 'تذكر هدفك: حلم كلية الهندسة يستحق كل دقيقة تعب وبذل. التوتر طبيعي ولكن تنفسك المنتظم يمنح عقلك أكسجيناً إضافياً للتفوق.',
    recommendedPhysicalAction: 'استنشق بعمق لـ 4 ثوان، احبس النفس لـ 4 ثوان، اخرج الزفير في 4 ثوان، وانتظر لـ 4 ثوان. كررها 4 مرات.',
    durationMinutes: 10
  }
];

export const initialScoutedResources: ScoutedResourceCandidate[] = [];
