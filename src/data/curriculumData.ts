import {
  DailyScheduleSlot,
  MultimediaLibraryItem,
  ExamEssential,
  SubjectProgress,
  DisciplineMetrics,
  BreakGuidance,
  ScoutedOfficialResource,
  UserProfile
} from '../types';

export const initialUser: UserProfile = {
  id: 'usr_ahmed_2027',
  name: 'أحمد محمود القاضي',
  email: 'ahmed.hamada.gana.2012@gmail.com',
  role: 'student',
  seatingNumber: '٤٨١٩٢٠',
  school: 'مدرسة المتفوقين الثانوية - القاهرة',
  governorate: 'القاهرة',
  targetFaculty: 'كلية الهندسة - جامعة القاهرة (شعبة حاسبات وذكاء اصطناعي)',
  dailyStreak: 18,
  disciplineScore: 94,
  preferredStudyHours: 7,
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
    isCompleted: true,
    aiPriorityReason: 'أولوية قصوى: هذا الدرس يشكل 14% من درجات ورقة التفاضل، ووردت منه مسألة مقالية في كل من 2022 و 2024 و 2025.',
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
    isCompleted: true,
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
    aiPriorityReason: 'تدريب عملي: حل 6 مسائل وزارية متدرجة الصعوبة لتثبيت معادلات الاتزان وحساب العزوم.',
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
    aiPriorityReason: 'مراجعة ختامية سريعة: نقطة لا يخلو منها الامتحان الرسمي (مسألة بكرات ومصاعد مؤكدة).',
    examEssentialKey: 'ess_dyn_1'
  }
];

export const initialExamEssentials: ExamEssential[] = [
  {
    id: 'ess_calc_1',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    topic: 'المعدلات الزمنية المرتبطة وتطبيقات القيم العظمى والصغرى',
    importanceRating: 100,
    pastExamOccurrences: ['دور أول 2021', 'دور أول 2022', 'دور ثان 2023', 'دور أول 2024', 'تجريبي 2025'],
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
    importanceRating: 98,
    pastExamOccurrences: ['دور أول 2021', 'دور ثان 2022', 'دور أول 2023', 'دور أول 2024'],
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
    importanceRating: 95,
    pastExamOccurrences: ['دور أول 2021', 'دور ثان 2021', 'دور أول 2022', 'دور أول 2023', 'دور أول 2024'],
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
    importanceRating: 96,
    pastExamOccurrences: ['دور أول 2022', 'دور أول 2023', 'دور ثان 2024'],
    coreConcept: 'مبدأ الشغل والطاقة: التغير في طاقة الحركة = مجموع الشغل المبذول من جميع القوى المؤثرة (ط - ط₀ = ش). في المصاعد: قراءة الميزان (الوزن الظاهري) ر = ك(د + جـ) عند الصعود بعجلة، و ر = ك(د - جـ) عند الهبوط بعجلة.',
    examTrapWarning: 'فخ شهير: نسيان تحويل الكتلة والوزن بين وحدة الكيلوجرام والنيوتن (الضرب في عجلة الجاذبية 9.8 م/ث²).',
    sampleExamQuestion: 'ميزان زنبركي مثبت في سقف مصعد يحمل جسماً كتلته ك كجم، فإذا كانت قراءة الميزان أثناء الصعود بعجلة منتظمة جـ هي ٤٩ نيوتن، وكانت قراءته أثناء الهبوط بنفس العجلة جـ هي ٣٩٫٢ نيوتن، أوجد كتلة الجسم ك والعجلة جـ.',
    stepByStepSolution: '1. أثناء الصعود: ر1 = ك(د + جـ) = 49 نيوتن.\n2. أثناء الهبوط: ر2 = ك(د - جـ) = 39.2 نيوتن.\n3. بجمع المعادلتين: 2 ك د = 49 + 39.2 = 88.2 => ك = 88.2 / (2 × 9.8) = 4.5 كجم.\n4. بالطرح: 2 ك جـ = 49 - 39.2 = 9.8 => جـ = 9.8 / (2 × 4.5) = 1.09 م/ث².'
  }
];

export const initialMultimediaLibrary: MultimediaLibraryItem[] = [
  // CALCULUS
  {
    id: 'med_calc_01',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'فيديو شرح تفصيلي: الاشتقاق الضمني والبارامتري وحل مسائل الامتحانات السابقة',
    description: 'شرح معتمد من منصة نجوى وبنك المعرفة لجميع حالات الاشتقاق مع فنيات التعامل مع الزوايا المثلثية ومقامات المشتقات.',
    fileType: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    sourceName: 'منصة نجوى التعليمية (معتمدة من moe.gov.eg)',
    rating: 4.9,
    durationOrPages: '38 دقيقة',
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-15'
  },
  {
    id: 'med_calc_02',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'كبسولة صوتية: مراجعة قوانين تفاضل وتكامل الدوال الأسية واللوغاريتمية والعدد e',
    description: 'تسجيل صوتي استرجاعي يركز على نهايات العدد النيبيري (e) وتكاملات الدوال الكسرية التي بسطها مشتقة مقامها.',
    fileType: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    sourceName: 'تسجيلات الإذاعة التعليمية المصرية',
    rating: 4.8,
    durationOrPages: '14 دقيقة',
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-20'
  },
  {
    id: 'med_calc_03',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'ملخص وقوانين التفاضل والتكامل الشاملة جاهز للطباعة (Cheat Sheet A4)',
    description: 'وثيقة PDF ملخصة تضم كافة قواعد الاشتقاق، قوانين التكامل، جدول الدوال المثلثية والنيبيرية، وخطوات رسم المنحنيات بصيغة مهيأة للطباعة المباشرة.',
    fileType: 'printable_doc',
    url: 'https://moe.gov.eg/media/calculus_summary_printable.pdf',
    sourceName: 'كتيب المفاهيم الرسمي الصادر عن وزارة التربية والتعليم',
    rating: 5.0,
    durationOrPages: '6 صفحات A4',
    isPrintable: true,
    printableCheatSheet: [
      'قاعدة السلسلة: دص/دس = (دص/دع) × (دع/دس).',
      'مشتقات الدوال المثلثية: [جا س]َ = جتا س ، [جتا س]َ = -جا س ، [ظا س]َ = قا² س ، [ظتا س]َ = -قتا² س ، [قا س]َ = قا س ظا س ، [قتا س]َ = -قتا س ظتا س.',
      'مشتقات الدوال الأسية واللوغاريتمية: [هـ^س]َ = هـ^س ، [أ^س]َ = أ^س لو_هـ(أ) ، [لو_هـ(س)]َ = 1/س.',
      'تكامل البسط مشتقة المقام: ∫ (دَ(س) / د(س)) دس = لو_هـ |د(س)| + ث.',
      'التكامل بالتجزيء: ∫ ص د ع = ص ع - ∫ ع د ص.',
      'حجم الجسم الدوراني حول محور السينات: ح = π ∫ (ص)² دس.'
    ],
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-05'
  },

  // STATICS
  {
    id: 'med_stat_01',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    title: 'فيديو تطبيقي: الاحتكاك والاتزان العام والازدواجات المحصلة',
    description: 'تحليل مسائل القضبان والسلالم المرتكزة مع توضيح شروط الاتزان العام وإيجاد مركز الثقل بطريقة الكتل الموجبة والسالبة.',
    fileType: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    sourceName: 'قناة مدرستنا 3 - وزارة التربية والتعليم',
    rating: 4.9,
    durationOrPages: '42 دقيقة',
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-18'
  },
  {
    id: 'med_stat_02',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    title: 'ملخص كبسولة قوانين الاستاتيكا الذهبية للطباعة (Cheat Sheet)',
    description: 'ورقة مفاهيم استاتيكا شاملة وموجزة لكافة وحدات المنهج: الاحتكاك، العزوم في ثنائي وثلاثي الأبعاد، القوى المتوازية، الاتزان العام، والازدواجات.',
    fileType: 'printable_doc',
    url: 'https://moe.gov.eg/media/statics_formulas_printable.pdf',
    sourceName: 'إدارة التعليم العام - توجيه الرياضيات',
    rating: 5.0,
    durationOrPages: '4 صفحات A4',
    isPrintable: true,
    printableCheatSheet: [
      'قوة الاحتكاك السكوني النهائي: ح_س = م_س × ر ، حيث م_س = ظا(ل) و ل هي زاوية الاحتكاك.',
      'رد الفعل الكلي المحصل: ر_ش = ر √(1 + م_س²) = ر قا(ل).',
      'عزم قوة حول نقطة في الفراغ: جـ_و = ر × ق = محدد المتجهات (س، ص، ع).',
      'طول العمود الساقط من نقطة العزم على خط عمل القوة: ل = |جـ_و| / |ق|.',
      'شروط الاتزان العام: Σ ق_س = 0 ، Σ ق_ص = 0 ، Σ جـ حول أي نقطة = 0.',
      'معيار عزم الازدواج: جـ = ± إحدى القوتين × البعد العمودي بينهما.'
    ],
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-10'
  },

  // PHYSICS
  {
    id: 'med_phys_01',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    title: 'فيديو شرح: قوانين كيرشوف وقانونا فاراداي ولينز في الحث الكهرومغناطيسي',
    description: 'شرح عملي وحل مباشر لأفكار امتحانات الأعوام 2021 إلى 2025 مع التركيز على اتجاه التيار المستحث وقاعدة اليد اليمنى لفليمنج.',
    fileType: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sourceName: 'بنك المعرفة المصري EKB',
    rating: 4.9,
    durationOrPages: '35 دقيقة',
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-22'
  },
  {
    id: 'med_phys_02',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    title: 'كتيب مفاهيم وقوانين الفيزياء للثانوية العامة جاهز للطباعة المباشرة',
    description: 'ملخص شامل لكل فصول الفيزياء: التيار الكهربي، التأثير المغناطيسي، الحث الكهرومغناطيسي، دوائر التيار المتردد، وفصول الفيزياء الحديثة.',
    fileType: 'printable_doc',
    url: 'https://moe.gov.eg/media/physics_formula_sheet.pdf',
    sourceName: 'مستشار مادة الفيزياء بوزارة التربية والتعليم',
    rating: 5.0,
    durationOrPages: '8 صفحات A4',
    isPrintable: true,
    printableCheatSheet: [
      'المقاومة النوعية والتوصيلية: R = ρ_e (L / A) ، σ = 1 / ρ_e.',
      'قانون أوم للدائرة المغلقة: I = V_B / (R_eq + r).',
      'كثافة الفيض المغناطيسي لسلك مستقيم: B = (μ I) / (2 π d) ، وللملف الدائري: B = (μ N I) / (2 r).',
      'القوة المغناطيسية: F = B I L جا(θ) ، وعزم الازدواج المغناطيسي: τ = B I A N جتا(θ).',
      'قانون فاراداي للحث: emf = -N (ΔΦ_m / Δt) ، والدينامو: emf_inst = N B A ω جا(θ).',
      'طاقة الفوتون وظاهرة كومتون: E = h ν = h c / λ ، كمية حركة الفوتون: p_L = h / λ.'
    ],
    isVerifiedByMinistry: true,
    uploadDate: '2026-10-12'
  }
];

export const initialSubjectProgress: SubjectProgress[] = [
  {
    subjectCode: 'CALCULUS',
    nameAr: 'التفاضل والتكامل',
    category: 'رياضيات بحتة',
    totalChapters: 4,
    completedChapters: 2,
    quizzesTaken: 12,
    averageScore: 88,
    masteryPercentage: 82,
    colorHex: '#2563EB',
    lastStudiedDate: 'اليوم',
    learningOutcomesTotal: 24,
    learningOutcomesMastered: 20
  },
  {
    subjectCode: 'ALGEBRA_SOLID_GEO',
    nameAr: 'الجبر والهندسة الفراغية',
    category: 'رياضيات بحتة',
    totalChapters: 4,
    completedChapters: 1,
    quizzesTaken: 8,
    averageScore: 84,
    masteryPercentage: 70,
    colorHex: '#7C3AED',
    lastStudiedDate: 'أمس',
    learningOutcomesTotal: 22,
    learningOutcomesMastered: 16
  },
  {
    subjectCode: 'STATICS',
    nameAr: 'الاستاتيكا',
    category: 'رياضيات تطبيقية',
    totalChapters: 6,
    completedChapters: 3,
    quizzesTaken: 10,
    averageScore: 91,
    masteryPercentage: 85,
    colorHex: '#D97706',
    lastStudiedDate: 'اليوم',
    learningOutcomesTotal: 20,
    learningOutcomesMastered: 17
  },
  {
    subjectCode: 'DYNAMICS',
    nameAr: 'الديناميكا',
    category: 'رياضيات تطبيقية',
    totalChapters: 4,
    completedChapters: 1,
    quizzesTaken: 7,
    averageScore: 78,
    masteryPercentage: 65,
    colorHex: '#EA580C',
    lastStudiedDate: 'منذ يومين',
    learningOutcomesTotal: 22,
    learningOutcomesMastered: 14
  },
  {
    subjectCode: 'PHYSICS',
    nameAr: 'الفيزياء',
    category: 'علوم فيزيائية',
    totalChapters: 8,
    completedChapters: 3,
    quizzesTaken: 14,
    averageScore: 86,
    masteryPercentage: 75,
    colorHex: '#059669',
    lastStudiedDate: 'اليوم',
    learningOutcomesTotal: 32,
    learningOutcomesMastered: 24
  },
  {
    subjectCode: 'CHEMISTRY',
    nameAr: 'الكيمياء',
    category: 'علوم فيزيائية',
    totalChapters: 5,
    completedChapters: 2,
    quizzesTaken: 9,
    averageScore: 82,
    masteryPercentage: 68,
    colorHex: '#0891B2',
    lastStudiedDate: 'منذ 3 أيام',
    learningOutcomesTotal: 26,
    learningOutcomesMastered: 18
  },
  {
    subjectCode: 'LANGUAGES',
    nameAr: 'اللغات (عربي / إنجليزي)',
    category: 'لغات',
    totalChapters: 6,
    completedChapters: 3,
    quizzesTaken: 11,
    averageScore: 90,
    masteryPercentage: 80,
    colorHex: '#DC2626',
    lastStudiedDate: 'أمس',
    learningOutcomesTotal: 28,
    learningOutcomesMastered: 23
  }
];

export const initialDisciplineMetrics: DisciplineMetrics = {
  totalStudyMinutesToday: 320,
  targetStudyMinutesToday: 420,
  weeklyAttendancePercent: 96,
  homeworkCompleted: 27,
  homeworkTotal: 29,
  currentStreakDays: 18,
  bestStreakDays: 24,
  disciplineScore: 94,
  badgesEarned: [
    { title: 'درع الالتزام الحديدي', icon: '🛡️', desc: 'إتمام 18 يوماً متواصلاً دون تفويت أي جلسة مذاكرة' },
    { title: 'قاهر التفاضل والتكامل', icon: '📐', desc: 'حل أكثر من 150 مسألة معدلات زمنية وقيم عظمى بنجاح' },
    { title: 'منضبط الواجبات', icon: '📝', desc: 'تسليم 95% من واجبات الأسبوع في الموعد المحدد' }
  ]
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

export const initialScoutedResources: ScoutedOfficialResource[] = [
  {
    id: 'sc_01',
    title: 'نماذج الوزارة الاسترشادية الرسمية المحدثة 2026/2027 - الرياضيات البحتة والتطبيقية',
    platform: 'moe.gov.eg',
    url: 'https://moe.gov.eg/exams2027/math_guidance_models.pdf',
    summary: 'تم نشر النموذج الرسمي المعتمد من توجيه الرياضيات بالوزارة شاملاً أسئلة البابل شيت والأسئلة المقالية طبقاً لمواصفات الورقة الامتحانية الحديثة.',
    suggestedSubject: 'التفاضل والتكامل والجبر',
    ratingScore: 5.0,
    dateDiscovered: '2026-10-24',
    status: 'pending',
    fileType: 'printable_doc'
  },
  {
    id: 'sc_02',
    title: 'مراجعة نواتج التعلم المركزة والمسائل المتوقعة في الفيزياء الحديثة والكهربية',
    platform: 'nagwa.com',
    url: 'https://nagwa.com/ar/egypt/thanaweya/physics_high_yield/',
    summary: 'مجموعة من 40 تدريباً تفاعلياً مصحوبة بفيديوهات حلول مفصلة تم إعدادها بالتعاون مع المركز القومي للامتحانات.',
    suggestedSubject: 'الفيزياء',
    ratingScore: 4.9,
    dateDiscovered: '2026-10-25',
    status: 'pending',
    fileType: 'video'
  },
  {
    id: 'sc_03',
    title: 'كبسولة قوانين الكيمياء الكهربية والعضوية المعتمدة من بنك المعرفة EKB',
    platform: 'ekb.eg',
    url: 'https://ekb.eg/curriculum/chemistry/organic_capsule.pdf',
    summary: 'مخطط تحويلات المركبات الأليفاتية والأروماتية مع أهم تفاعلات التمييز المخبري ونواتج التحلل المائي للإسترات.',
    suggestedSubject: 'الكيمياء',
    ratingScore: 4.9,
    dateDiscovered: '2026-10-26',
    status: 'approved',
    fileType: 'printable_doc'
  }
];
