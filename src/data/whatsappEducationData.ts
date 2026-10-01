import {
  StudentWhatsAppConfig,
  TeacherPlatformEntry,
  DownloadedMediaMaterial,
  MonthlyPacingTimeline
} from '../types/whatsappEducation';

export const INITIAL_STUDENT_WHATSAPP_CONFIG: StudentWhatsAppConfig = {
  studentName: 'أحمد محمود العبد',
  phoneNumber: '+201018849201',
  nationalId: '30704150102938',
  isRegisteredOnPlatform: true,
  registrationDate: '2026-09-01',
  defaultStorageDirectory: 'D:/ThanaweyaAmma_2027/',
  notificationsEnabled: true,
  autoOrganizeDownloads: true
};

export const INITIAL_TEACHERS_PLATFORMS: TeacherPlatformEntry[] = [
  {
    id: 't_calc_essam',
    name: 'مستر أحمد عصام',
    titlePrefix: 'مستر',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    whatsAppNumber: '+201023456789',
    assistantWhatsAppNumber: '+201023456780',
    platformName: 'منصة الأوائل التعليمية',
    groupName: 'دفعة 2027 - سوبر تفاضل وتكامل (A)',
    studentSubscriptionCode: 'THN-CALC-842',
    lectureDays: 'السبت والثلاثاء (7:00 مساءً)',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/',
    activeNotes: 'الواجب يُسلم بي دي إف قبل كل محاضرة بـ 6 ساعات على واتساب المساعدين.',
    avatarColor: 'from-emerald-600 to-teal-700',
    materialsCount: 6
  },
  {
    id: 't_phys_maboud',
    name: 'مستر محمد عبد المعبود',
    titlePrefix: 'مستر',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    whatsAppNumber: '+201112233445',
    assistantWhatsAppNumber: '+201112233440',
    platformName: 'أكاديمية نيوتن للفيزياء',
    groupName: 'فيزياء الثانوية العامة - شعبة رياضة',
    studentSubscriptionCode: 'NWT-PHYS-319',
    lectureDays: 'الأحد والأربعاء (8:00 مساءً)',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Physics/Mr_AbdelMaboud/',
    activeNotes: 'كويز أسبوعي إجباري على المنصة ومناقشة التريكات في فويس نوت الواتس.',
    avatarColor: 'from-blue-600 to-indigo-700',
    materialsCount: 5
  },
  {
    id: 't_mech_nasser',
    name: 'مستر ناصر سالم',
    titlePrefix: 'مستر',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا والديناميكا',
    whatsAppNumber: '+201099887766',
    assistantWhatsAppNumber: '+201099887760',
    platformName: 'سنتر الصفوة التعليمي & منصة إيديوميتر',
    groupName: 'نخبة الميكانيكا - ثانوية 2027',
    studentSubscriptionCode: 'SAF-MECH-512',
    lectureDays: 'الاثنين والخميس (6:00 مساءً)',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Mechanics/Mr_NasserSalem/',
    activeNotes: 'التركيز على رسومات القوى واتزان القضبان والعزوم ثلاثية الأبعاد.',
    avatarColor: 'from-amber-600 to-orange-700',
    materialsCount: 5
  },
  {
    id: 't_chem_saqr',
    name: 'مستر خالد صقر',
    titlePrefix: 'مستر',
    subjectCode: 'CHEMISTRY',
    subjectNameAr: 'الكيمياء',
    whatsAppNumber: '+201223344556',
    assistantWhatsAppNumber: '+201223344550',
    platformName: 'منصة الكيمياء الذكية',
    groupName: 'أبطال الكيمياء ثانوية عامة 2027',
    studentSubscriptionCode: 'CHM-SAQR-771',
    lectureDays: 'الجمعة (2:00 ظهراً)',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Chemistry/Mr_KhaledSaqr/',
    activeNotes: 'شيت مسائل الاتزان الأيوني والكيمياء الكهربية يُرسل محلولاً ومصححاً.',
    avatarColor: 'from-rose-600 to-pink-700',
    materialsCount: 4
  },
  {
    id: 't_alg_magdy',
    name: 'مستر مجدي عبد الفتاح',
    titlePrefix: 'مستر',
    subjectCode: 'ALGEBRA_SOLID_GEO',
    subjectNameAr: 'الجبر والهندسة الفراغية',
    whatsAppNumber: '+201055443322',
    assistantWhatsAppNumber: '+201055443320',
    platformName: 'أكاديمية العباقرة',
    groupName: 'جروب الفراغية والأوميجا الذهبي',
    studentSubscriptionCode: 'ABQ-ALG-604',
    lectureDays: 'السبت (5:00 مساءً)',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Algebra/Mr_Magdy/',
    activeNotes: 'حلول نماذج الامتحانات الوزارية السابقة من 2021 إلى 2026.',
    avatarColor: 'from-purple-600 to-violet-700',
    materialsCount: 4
  }
];

export const INITIAL_DOWNLOADED_MATERIALS: DownloadedMediaMaterial[] = [
  // CALCULUS
  {
    id: 'mat_calc_01',
    title: 'محاضرة 1: اشتقاق مقلوبات الدوال المثلثية (القا، القتا، والظتا)',
    teacherId: 't_calc_essam',
    teacherName: 'مستر أحمد عصام',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    fileType: 'video_lecture',
    fileName: 'Calc_Lec01_TrigDerivatives_FullHD.mp4',
    fileSizeBytes: 245367000,
    fileSizeHuman: '234.0 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Calc_Lec01_TrigDerivatives_FullHD.mp4',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-04',
    curriculumUnitName: 'الوحدة الأولى: اشتقاق الدوال وتطبيقاته',
    downloadDate: '2026-10-02',
    isCompleted: true,
    notes: 'تم حل أسئلة كتاب المعاصر ص 18-24 والتنبيه على قاعدة إشارة مشتقات حرف التاء.'
  },
  {
    id: 'mat_calc_02',
    title: 'مذكرة الشرح والواجب رقم 1: اشتقاق الدوال المثلثية ونواتج التعلم',
    teacherId: 't_calc_essam',
    teacherName: 'مستر أحمد عصام',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    fileType: 'pdf_sheet',
    fileName: 'Calc_Sheet01_TrigFunctions_PrintReady.pdf',
    fileSizeBytes: 12450000,
    fileSizeHuman: '11.8 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Calc_Sheet01_TrigFunctions_PrintReady.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-05',
    curriculumUnitName: 'الوحدة الأولى: اشتقاق الدوال وتطبيقاته',
    downloadDate: '2026-10-02',
    isCompleted: true,
    notes: 'مذكرة معتمدة منسقة A4 تتضمن 50 مسألة اختر و4 مسائل مقالية.'
  },
  {
    id: 'mat_calc_03',
    title: 'محاضرة 2: المشتقات ذات الرتب العليا والاشتقاق البارامتري والضمني',
    teacherId: 't_calc_essam',
    teacherName: 'مستر أحمد عصام',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    fileType: 'video_lecture',
    fileName: 'Calc_Lec02_HigherOrder_Parametric.mp4',
    fileSizeBytes: 310450000,
    fileSizeHuman: '296.0 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Calc_Lec02_HigherOrder_Parametric.mp4',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-11',
    curriculumUnitName: 'الوحدة الأولى: اشتقاق الدوال وتطبيقاته',
    downloadDate: '2026-10-08',
    isCompleted: true,
    notes: 'شرح فكرة إيجاد المشتقة رقم 2027 للدوال الدورية ومصفوفة الاشتقاق.'
  },
  {
    id: 'mat_calc_04',
    title: 'ريكورد صوتي فائق السرعة: تريكات وخلاصة مسائل المعدلات الزمنية المرتبطة',
    teacherId: 't_calc_essam',
    teacherName: 'مستر أحمد عصام',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    fileType: 'voice_summary',
    fileName: 'Calc_Audio01_RelatedRates_VoiceTricks.m4a',
    fileSizeBytes: 8900000,
    fileSizeHuman: '8.5 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Calc_Audio01_RelatedRates_VoiceTricks.m4a',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-18',
    curriculumUnitName: 'الوحدة الأولى: اشتقاق الدوال وتطبيقاته',
    downloadDate: '2026-10-15',
    isCompleted: false,
    notes: 'فويس نوت مدته 14 دقيقة يلخص خطوات فرض المتغيرات ومسائل السلم والظل والماء.'
  },
  {
    id: 'mat_calc_05',
    title: 'نموذج الإجابة الرسمي لكويز أكتوبر: التفاضل والتكامل مع باريم الدرجات',
    teacherId: 't_calc_essam',
    teacherName: 'مستر أحمد عصام',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    fileType: 'model_answer',
    fileName: 'Calc_Quiz_October_ModelAnswer.pdf',
    fileSizeBytes: 5400000,
    fileSizeHuman: '5.1 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Calc_Quiz_October_ModelAnswer.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-25',
    curriculumUnitName: 'الوحدة الأولى: اشتقاق الدوال وتطبيقاته',
    downloadDate: '2026-10-24',
    isCompleted: false,
    notes: 'تحليل أخطاء الطلاب الشائعة في مسائل الظل وسلم الانزلاق.'
  },
  // PHYSICS
  {
    id: 'mat_phys_01',
    title: 'محاضرة 1: قانون أوم وتوصيل المقاومات والتجزئة وقنطرة وتستون',
    teacherId: 't_phys_maboud',
    teacherName: 'مستر محمد عبد المعبود',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    fileType: 'video_lecture',
    fileName: 'Phys_Lec01_OhmsLaw_Resistors.mp4',
    fileSizeBytes: 280000000,
    fileSizeHuman: '267.0 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Physics/Mr_AbdelMaboud/Phys_Lec01_OhmsLaw_Resistors.mp4',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-06',
    curriculumUnitName: 'الفصل الأول: التيار الكهربي وقانون أوم وقانونا كيرشوف',
    downloadDate: '2026-10-03',
    isCompleted: true,
    notes: 'شرح طريقة النقاط في تبسيط الدوائر المعقدة وإلغاء المقاومات المتساوية الجهد.'
  },
  {
    id: 'mat_phys_02',
    title: 'شيت الواجب الشامل رقم 1: مسائل الدوائر الكهربية وقانون أوم للدائرة المغلقة',
    teacherId: 't_phys_maboud',
    teacherName: 'مستر محمد عبد المعبود',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    fileType: 'pdf_sheet',
    fileName: 'Phys_Sheet01_CircuitCalculations.pdf',
    fileSizeBytes: 9800000,
    fileSizeHuman: '9.3 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Physics/Mr_AbdelMaboud/Phys_Sheet01_CircuitCalculations.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-08',
    curriculumUnitName: 'الفصل الأول: التيار الكهربي وقانون أوم وقانونا كيرشوف',
    downloadDate: '2026-10-04',
    isCompleted: true,
    notes: 'يحتوي على 80 مسألة تشمل امتحانات الثانوية العامة من 2021 حتى 2026.'
  },
  {
    id: 'mat_phys_03',
    title: 'محاضرة 2: قانونا كيرشوف وحل المعادلات بالآلة الحاسبة وبطريقة المصفوفات',
    teacherId: 't_phys_maboud',
    teacherName: 'مستر محمد عبد المعبود',
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    fileType: 'video_lecture',
    fileName: 'Phys_Lec02_KirchhoffsLaws_Secrets.mp4',
    fileSizeBytes: 295000000,
    fileSizeHuman: '281.3 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Physics/Mr_AbdelMaboud/Phys_Lec02_KirchhoffsLaws_Secrets.mp4',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-15',
    curriculumUnitName: 'الفصل الأول: التيار الكهربي وقانون أوم وقانونا كيرشوف',
    downloadDate: '2026-10-12',
    isCompleted: false,
    notes: 'قواعد الإشارات عند عبور البطاريات والمقاومات وطرق التدقيق السريع للناتج.'
  },
  // MECHANICS (STATICS & DYNAMICS)
  {
    id: 'mat_mech_01',
    title: 'مذكرة الشرح والتمارين: الاحتكاك والاتزان على مستوى أفقي ومائل خشن',
    teacherId: 't_mech_nasser',
    teacherName: 'مستر ناصر سالم',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا والديناميكا',
    fileType: 'pdf_sheet',
    fileName: 'Statics_Friction_Unit01_FullSheet.pdf',
    fileSizeBytes: 14200000,
    fileSizeHuman: '13.5 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Mechanics/Mr_NasserSalem/Statics_Friction_Unit01_FullSheet.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-09',
    curriculumUnitName: 'الوحدة الأولى: الاحتكاك والاتزان',
    downloadDate: '2026-10-05',
    isCompleted: true,
    notes: 'قوانين قوة الاحتكاك النهائي Fs = Us * R وزاوية الاحتكاك لندا.'
  },
  {
    id: 'mat_mech_02',
    title: 'فيديو حل بنك أسئلة الوزارة ونماذج نجوى: عزم قوة حول نقطة في الفراغ',
    teacherId: 't_mech_nasser',
    teacherName: 'مستر ناصر سالم',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا والديناميكا',
    fileType: 'video_lecture',
    fileName: 'Statics_Moments3D_Vectors_Nagwa.mp4',
    fileSizeBytes: 220000000,
    fileSizeHuman: '209.8 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Mechanics/Mr_NasserSalem/Statics_Moments3D_Vectors_Nagwa.mp4',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-20',
    curriculumUnitName: 'الوحدة الثانية: العزوم في المستوى والفراغ',
    downloadDate: '2026-10-18',
    isCompleted: false,
    notes: 'استخدام محدد الضرب الاتجاهي وحساب طول العمود الساقط من نقطة على خط العمل.'
  },
  // ALGEBRA
  {
    id: 'mat_alg_01',
    title: 'مذكرة مبدأ العد والتباديل والتوافيق ونظرية ذات الحدين',
    teacherId: 't_alg_magdy',
    teacherName: 'مستر مجدي عبد الفتاح',
    subjectCode: 'ALGEBRA_SOLID_GEO',
    subjectNameAr: 'الجبر والهندسة الفراغية',
    fileType: 'pdf_sheet',
    fileName: 'Algebra_Permutations_Combinations_Sheet01.pdf',
    fileSizeBytes: 16500000,
    fileSizeHuman: '15.7 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Algebra/Mr_Magdy/Algebra_Permutations_Combinations_Sheet01.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-13',
    curriculumUnitName: 'الوحدة الأولى: التباديل والتوافيق ونظرية ذات الحدين',
    downloadDate: '2026-10-10',
    isCompleted: true,
    notes: 'الفرق الجوهري بين الترتيب والإحلال ومسائل تكوين الأعداد والجلوس في صف أو دائرة.'
  },
  // CHEMISTRY
  {
    id: 'mat_chem_01',
    title: 'مذكرة العناصر الانتقالية والسبائك وخامات الحديد والأكاسيد',
    teacherId: 't_chem_saqr',
    teacherName: 'مستر خالد صقر',
    subjectCode: 'CHEMISTRY',
    subjectNameAr: 'الكيمياء',
    fileType: 'pdf_sheet',
    fileName: 'Chemistry_Unit01_TransitionMetals_A4.pdf',
    fileSizeBytes: 19800000,
    fileSizeHuman: '18.9 MB',
    localFolderPath: 'D:/ThanaweyaAmma_2027/Chemistry/Mr_KhaledSaqr/Chemistry_Unit01_TransitionMetals_A4.pdf',
    targetMonthKey: '2026-10',
    targetMonthName: 'شهر أكتوبر 2026',
    scheduledStudyDate: '2026-10-16',
    curriculumUnitName: 'الباب الأول: العناصر الانتقالية',
    downloadDate: '2026-10-14',
    isCompleted: false,
    notes: 'مخطط التحويلات السهمية لأكاسيد الحديد المغناطيسي والثلاثي والثنائي.'
  }
];

export const MONTHLY_PACING_TIMELINE_DATA: MonthlyPacingTimeline[] = [
  {
    monthKey: '2026-10',
    monthNameAr: 'شهر أكتوبر 2026',
    themeTitle: 'انطلاقة المنهج وتأسيس الاشتقاق، التيار الكهربي، والاحتكاك',
    weekPlans: [
      {
        weekNumber: 1,
        weekTitle: 'الأسبوع 1: 1 إلى 7 أكتوبر',
        focusOutcome: 'إتقان اشتقاق الدوال المثلثية، قانون أوم ومقاومات الدائرة، وقوى الاحتكاك الأفقي.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'اشتقاق مقلوبات الدوال المثلثية', requiredLectures: 2 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'توصيل المقاومات وحساب شدة التيار', requiredLectures: 2 },
          { subjectCode: 'STATICS', subjectName: 'استاتيكا', targetChapter: 'الاحتكاك على مستوى أفقي خشن', requiredLectures: 1 }
        ]
      },
      {
        weekNumber: 2,
        weekTitle: 'الأسبوع 2: 8 إلى 14 أكتوبر',
        focusOutcome: 'الاشتقاق البارامتري، قانون أوم للدائرة المغلقة، والتباديل والتوافيق.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'الاشتقاق الضمني والبارامتري', requiredLectures: 2 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'قانون أوم للدائرة المغلقة', requiredLectures: 2 },
          { subjectCode: 'ALGEBRA_SOLID_GEO', subjectName: 'جبر', targetChapter: 'مبدأ العد والتباديل والتوافيق', requiredLectures: 1 }
        ]
      },
      {
        weekNumber: 3,
        weekTitle: 'الأسبوع 3: 15 إلى 21 أكتوبر',
        focusOutcome: 'مسائل المعدلات الزمنية، قانونا كيرشوف، والعزوم ثلاثية الأبعاد.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'المعدلات الزمنية المرتبطة', requiredLectures: 2 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'قانونا كيرشوف وحل المسارات المغلقة', requiredLectures: 2 },
          { subjectCode: 'STATICS', subjectName: 'استاتيكا', targetChapter: 'العزوم في نظام إحداثي متعامد ثلاثي', requiredLectures: 1 }
        ]
      },
      {
        weekNumber: 4,
        weekTitle: 'الأسبوع 4: 22 إلى 31 أكتوبر',
        focusOutcome: 'المراجعة الشاملة لخرائط الذهن وإجراء اختبار شهر أكتوبر الوزاري.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'اختبار شهر أكتوبر التجريبي', requiredLectures: 1 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'المراجعة وحل بنك أسئلة الفصل الأول', requiredLectures: 1 },
          { subjectCode: 'CHEMISTRY', subjectName: 'كيمياء', targetChapter: 'خواص وتفاعلات أكاسيد الحديد', requiredLectures: 1 }
        ]
      }
    ]
  },
  {
    monthKey: '2026-11',
    monthNameAr: 'شهر نوفمبر 2026',
    themeTitle: 'التكامل والدوال اللوغاريتمية والأسية، التأثير المغناطيسي، وتفاضل المتجهات',
    weekPlans: [
      {
        weekNumber: 5,
        weekTitle: 'الأسبوع 1: 1 إلى 7 نوفمبر',
        focusOutcome: 'العدد النيبيري e واشتقاق الدوال الأسية، والمجال المغناطيسي لسلك وملف دائري.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'الاشتقاق والتكامل للوغاريتمات والأسس', requiredLectures: 2 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'المجال المغناطيسي للتيار الكهربي', requiredLectures: 2 },
          { subjectCode: 'DYNAMICS', subjectName: 'ديناميكا', targetChapter: 'تفاضل وتكامل الدوال المتجهة والسرعة', requiredLectures: 1 }
        ]
      },
      {
        weekNumber: 6,
        weekTitle: 'الأسبوع 2: 8 إلى 14 نوفمبر',
        focusOutcome: 'القوة المغناطيسية وعزم الازدواج، ونظرية ذات الحدين بنهاية الحد العام.',
        subjectsPlan: [
          { subjectCode: 'CALCULUS', subjectName: 'تفاضل وتكامل', targetChapter: 'تطبيقات على القيم العظمى والصغرى', requiredLectures: 2 },
          { subjectCode: 'PHYSICS', subjectName: 'فيزياء', targetChapter: 'أجهزة القياس الكهربي (الجلفانومتر والأميتر)', requiredLectures: 2 },
          { subjectCode: 'ALGEBRA_SOLID_GEO', subjectName: 'جبر', targetChapter: 'نظرية ذات الحدين والنسبة بين حدين متتاليين', requiredLectures: 1 }
        ]
      }
    ]
  },
  {
    monthKey: '2026-12',
    monthNameAr: 'شهر ديسمبر 2026',
    themeTitle: 'رسم المنحنيات والمساحات، الحث الكهرومغناطيسي، وقوانين نيوتن',
    weekPlans: []
  },
  {
    monthKey: '2027-01',
    monthNameAr: 'شهر يناير 2027',
    themeTitle: 'مراجعات نصف العام، امتحانات الفصل الدراسي الأول الشاملة',
    weekPlans: []
  },
  {
    monthKey: '2027-02',
    monthNameAr: 'شهر فبراير 2027',
    themeTitle: 'التيار المتردد، الكيمياء العضوية، مركز الثقل والشغل والطاقة',
    weekPlans: []
  },
  {
    monthKey: '2027-03',
    monthNameAr: 'شهر مارس 2027',
    themeTitle: 'الفيزياء الحديثة، الأعداد المركبة (دي موافر)، والتصادم والبكرات',
    weekPlans: []
  },
  {
    monthKey: '2027-04',
    monthNameAr: 'شهر أبريل 2027',
    themeTitle: 'إنهاء المناهج وبدء المراجعات النهائية وفك شفرات امتحانات الثانوية العامة',
    weekPlans: []
  },
  {
    monthKey: '2027-05',
    monthNameAr: 'شهر مايو 2027',
    themeTitle: 'المعسكر المغلق: حل 30 نموذج بابل شيت وزاري لكل مادة وتدريب التوقيت',
    weekPlans: []
  },
  {
    monthKey: '2027-06',
    monthNameAr: 'شهر يونيو 2027',
    themeTitle: 'المراجعات ليلة الامتحان وبروتوكول كتيب المفاهيم المعتمد في اللجان',
    weekPlans: []
  }
];

// Helper functions for persistent storage
const STORAGE_KEYS = {
  CONFIG: 'thanaweya_student_wa_v2',
  TEACHERS: 'thanaweya_teachers_wa_v2',
  MATERIALS: 'thanaweya_materials_wa_v2'
};

export function loadStudentConfig(): StudentWhatsAppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error loading student WA config:', e);
  }
  return INITIAL_STUDENT_WHATSAPP_CONFIG;
}

export function saveStudentConfig(config: StudentWhatsAppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving student WA config:', e);
  }
}

export function loadTeachers(): TeacherPlatformEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error loading teachers:', e);
  }
  return INITIAL_TEACHERS_PLATFORMS;
}

export function saveTeachers(teachers: TeacherPlatformEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.warn('Error saving teachers:', e);
  }
}

export function loadMaterials(): DownloadedMediaMaterial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error loading materials:', e);
  }
  return INITIAL_DOWNLOADED_MATERIALS;
}

export function saveMaterials(materials: DownloadedMediaMaterial[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  } catch (e) {
    console.warn('Error saving materials:', e);
  }
}
