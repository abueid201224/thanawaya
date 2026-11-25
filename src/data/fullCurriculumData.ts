import { CurriculumUnit, MonthlyExam } from '../types';

export const initialCurriculumUnits: CurriculumUnit[] = [
  // ==========================================
  // CALCULUS (التفاضل والتكامل) - PILOT REVIEWED UNITS 1 & 2
  // ==========================================
  {
    id: 'unit_calc_01',
    unitNumber: 1,
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'الوحدة الأولى: اشتقاق الدوال المثلثية والاشتقاق الضمني والبارامتري والمعدلات الزمنية',
    description:
      'مشتقات قا، قتا، ظتا، قاعدة السلسلة والاشتقاق الضمني، الاشتقاق البارامتري بالنسبة للزمن أو وسيط، وتطبيقات المعدلات الزمنية المرتبطة الهندسية والفيزيائية.',
    learningOutcomes: [
      'إتقان اشتقاق قا، قتا، ظتا ومعالجة مقلوباتها وزواياها المركبة',
      'تطبيق الاشتقاق الضمني لإيجاد ميل المماس والعمودي',
      'صياغة العلاقات الرياضية للمعدلات الزمنية المرتبطة وحلها بدقة'
    ],
    status: 'not_started',
    studyNotesSummary: [
      'مشتقات الدوال المثلثية: $\\frac{d}{dx}(\\sin x) = \\cos x$، $\\frac{d}{dx}(\\cos x) = -\\sin x$، $\\frac{d}{dx}(\\tan x) = \\sec^2 x$، $\\frac{d}{dx}(\\cot x) = -\\csc^2 x$.',
      'في الاشتقاق الضمني: اشتق الطرفين بالنسبة إلى $x$ مع مراعاة ضرب مشتقة كل حد يحتوي على $y$ في $\\frac{dy}{dx}$.',
      'في المعدلات الزمنية: اكتب العلاقة الهندسية المساعدة أولاً ثم اشتق الطرفين بالنسبة للزمن $t$.'
    ],
    localResourcesCount: 4,
    lastUpdatedDate: '2026-10-20',
    practiceQuestions: [
      {
        id: 'pq_calc_1_1',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-20',
        verifiedBySympy: true,
        questionNumber: 1,
        questionText: 'إذا كانت $y = \\cot^2(3x)$، فإن $\\frac{dy}{dx}$ تساوي:',
        options: [
          { key: 'A', text: '$-3\\cot(3x)\\csc^2(3x)$' },
          { key: 'B', text: '$6\\cot(3x)\\csc(3x)$' },
          { key: 'C', text: '$-6\\cot(3x)\\csc^2(3x)$' },
          { key: 'D', text: '$-6\\cot^2(3x)\\csc^2(3x)$' }
        ],
        correctKey: 'C',
        explanation:
          'بتطبيق قاعدة السلسلة: $\\frac{dy}{dx} = 2\\cot(3x) \\cdot (-\\csc^2(3x)) \\cdot 3 = -6\\cot(3x)\\csc^2(3x)$.',
        solutionSteps: [
          'اعتبر الدالة مرفوعة للأس 2: $y = [\\cot(3x)]^2$.',
          'اشتق القوس أولاً: $2\\cot(3x) \\cdot \\frac{d}{dx}(\\cot(3x))$.',
          'مشتقة $\\cot(3x)$ هي $-\\csc^2(3x) \\cdot 3$.',
          'بضرب المعاملات معاً ينتج: $-6\\cot(3x)\\csc^2(3x)$.'
        ],
        hints: [
          'تذكّر أن $\\cot^2(3x)$ تعني $[\\cot(3x)]^2$، أي أنها دالة مركبة من ثلاث طبقات.',
          'استخدم قاعدة القوس $\\frac{d}{dx}[u(x)]^n = n[u(x)]^{n-1} u\'(x)$ مع قاعدة $\\frac{d}{dx}(\\cot \\theta) = -\\csc^2 \\theta$.',
          'ابدأ بكتابة: $2\\cot(3x) \\times \\frac{d}{dx}(\\cot(3x))$ ولا تنسَ ضرب الناتج في مشتقة الزاوية $3x$.'
        ],
        difficulty: 'B',
        targetedLearningOutcome: 'تطبيق قاعدة مشتقة القوس ومشتقات الدوال المثلثية',
        examSource: 'ثانوية عامة 2021 دور أول'
      },
      {
        id: 'pq_calc_1_2',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-20',
        verifiedBySympy: true,
        questionNumber: 2,
        questionText:
          'سلم طوله $10$ أمتار يستند بطرفه العلوي على حائط رأسي وبطرفه السفلي على أرض أفقية، فإذا انزلق الطرف السفلي مبتعداً عن الحائط بمعدل $2\\text{ m/s}$، فإن معدل تغير ارتفاع الطرف العلوي عندما يبعد الطرف السفلي $6$ أمتار عن الحائط يساوي:',
        options: [
          { key: 'A', text: '$-2\\text{ m/s}$' },
          { key: 'B', text: '$-1.5\\text{ m/s}$' },
          { key: 'C', text: '$1.5\\text{ m/s}$' },
          { key: 'D', text: '$-0.75\\text{ m/s}$' }
        ],
        correctKey: 'B',
        explanation:
          'من نظرية فيثاغورس: $x^2 + y^2 = 100$. عندما $x = 6$ يكون $y = 8$. بالاشتقاق بالنسبة للزمن: $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0 \\implies 6(2) + 8\\frac{dy}{dt} = 0 \\implies \\frac{dy}{dt} = -1.5\\text{ m/s}$.',
        solutionSteps: [
          'العلاقة الهندسية بين البعد الأفقي $x$ والارتفاع الرأسي $y$: $x^2 + y^2 = 10^2 = 100$.',
          'عند اللحظة $x = 6$: نحسب $y = \\sqrt{100 - 36} = 8$ أمتار.',
          'نشتق طرفي العلاقة بالنسبة للزمن $t$: $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0$.',
          'بالتعويض ($x=6, y=8, \\frac{dx}{dt}=2$): $12 + 8\\frac{dy}{dt} = 0 \\implies \\frac{dy}{dt} = -\\frac{12}{8} = -1.5\\text{ m/s}$.'
        ],
        hints: [
          'ارسم المثلث القائم الذي يشكله السلم مع الحائط والأرض وحدد الثوابت والمتغيرات.',
          'اربط بين $x$ و $y$ وطول السلم الثابت $10$ باستخدام نظرية فيثاغورس قبل الاشتقاق.',
          'احسب قيمة $y$ لحظة $x = 6$ أولاً، ثم اشتق المعادلة $x^2 + y^2 = 100$ بالنسبة للزمن $t$.'
        ],
        difficulty: 'A',
        targetedLearningOutcome: 'حل مسائل السلالم والمعدلات الزمنية المرتبطة',
        examSource: 'ثانوية عامة 2023 دور أول'
      },
      {
        id: 'pq_calc_1_3',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-20',
        verifiedBySympy: true,
        questionNumber: 3,
        questionText: 'ميل المماس للمنحنى البارامتري $x = t^2 - 1$ ، $y = t^3 - 4$ عند $t = 2$ يساوي:',
        options: [
          { key: 'A', text: '$6$' },
          { key: 'B', text: '$4$' },
          { key: 'C', text: '$1.5$' },
          { key: 'D', text: '$3$' }
        ],
        correctKey: 'D',
        explanation:
          '$\\frac{dx}{dt} = 2t$ و $\\frac{dy}{dt} = 3t^2$. إذن $\\frac{dy}{dx} = \\frac{3t^2}{2t} = \\frac{3}{2}t$. عند $t = 2$: ميل المماس يساوي $\\frac{3}{2}(2) = 3$.',
        solutionSteps: [
          'نحسب مشتقة $x$ بالنسبة للوسيط $t$: $\\frac{dx}{dt} = 2t$.',
          'نحسب مشتقة $y$ بالنسبة للوسيط $t$: $\\frac{dy}{dt} = 3t^2$.',
          'نطبق قاعدة الاشتقاق البارامتري: $\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt} = \\frac{3t^2}{2t}$.',
          'نعوض عن $t = 2$: $\\frac{3(4)}{2(2)} = \\frac{12}{4} = 3$.'
        ],
        hints: [
          'ميل المماس هو $\\frac{dy}{dx}$، لكن كلّاً من $x$ و $y$ دالة في الوسيط $t$.',
          'استخدم قاعدة الاشتقاق البارامتري: $\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}$ بشرط $\\frac{dx}{dt} \\neq 0$.',
          'أوجد $\\frac{dx}{dt}$ و $\\frac{dy}{dt}$ بشكل مستقل، ثم اقسمهما قبل أو بعد التعويض بقيمة $t = 2$.'
        ],
        difficulty: 'C',
        targetedLearningOutcome: 'الاشتقاق البارامتري وحساب ميل المماس',
        examSource: 'تجريبي 2024'
      }
    ]
  },
  {
    id: 'unit_calc_02',
    unitNumber: 2,
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'الوحدة الثانية: الدوال الأسية واللوغاريتمية والعدد النيبيري e وتكاملاتها',
    description:
      'نهايات العدد النيبيري، اشتقاق وتكامل الدوال الأسية ذات الأساس الطبيعي والعام، اشتقاق وتكامل الدوال اللوغاريتمية، والتكامل بالتجزيء.',
    learningOutcomes: [
      'استخدام نهايات العدد النيبيري لحساب النهايات المتقدمة',
      'تطبيق قوانين اشتقاق الدوال الأسية واللوغاريتمية',
      'إتقان التكامل بالتجزيء وتكامل الكسور التي بسطها مشتقة مقامها'
    ],
    status: 'not_started',
    studyNotesSummary: [
      '$\\lim_{x \\to 0}(1 + x)^{1/x} = e$ و $\\lim_{x \\to \\infty}(1 + \\frac{1}{x})^x = e$.',
      '$\\frac{d}{dx}(e^x) = e^x$ و $\\frac{d}{dx}(\\ln|x|) = \\frac{1}{x}$.',
      'تكامل كسر بسطه مشتقة مقامه: $\\int \\frac{f\'(x)}{f(x)}\\,dx = \\ln|f(x)| + C$.',
      'التكامل بالتجزيء: $\\int u\\,dv = u v - \\int v\\,du$.'
    ],
    localResourcesCount: 3,
    lastUpdatedDate: '2026-10-22',
    practiceQuestions: [
      {
        id: 'pq_calc_2_1',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-22',
        verifiedBySympy: true,
        questionNumber: 1,
        questionText: 'قيمة التكامل $\\int \\frac{2x + 3}{x^2 + 3x + 5}\\,dx$ تساوي:',
        options: [
          { key: 'A', text: '$\\ln|x^2 + 3x + 5| + C$' },
          { key: 'B', text: '$(x^2 + 3x + 5)^2 + C$' },
          { key: 'C', text: '$2\\ln|x^2 + 3x + 5| + C$' },
          { key: 'D', text: '$e^{x^2 + 3x + 5} + C$' }
        ],
        correctKey: 'A',
        explanation:
          'مشتقة المقام $f(x) = x^2 + 3x + 5$ هي $f\'(x) = 2x + 3$، وهي مطابقة تماماً للبسط. إذن التكامل يساوي $\\ln|x^2 + 3x + 5| + C$.',
        solutionSteps: [
          'نفرض $f(x) = x^2 + 3x + 5$.',
          'نشتق المقام: $f\'(x) = 2x + 3$.',
          'نلاحظ أن البسط يساوي تماماً $f\'(x)$، فنطبق قاعدة اللوغاريتم الطبيعي للتكامل.'
        ],
        hints: [
          'افحص العلاقة بين مشتقة المقام والبسط قبل التفكير في تحليل الكسر.',
          'تذكّر القاعدة: $\\int \\frac{f\'(x)}{f(x)}\\,dx = \\ln|f(x)| + C$.',
          'احسب $\\frac{d}{dx}(x^2 + 3x + 5)$ وقارن الناتج ببسط الكسر.'
        ],
        difficulty: 'C',
        targetedLearningOutcome: 'تكامل البسط مشتقة المقام',
        examSource: 'ثانوية عامة 2022'
      },
      {
        id: 'pq_calc_2_2',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-22',
        verifiedBySympy: true,
        questionNumber: 2,
        questionText: 'ناتج التكامل بالتجزيء $\\int x e^x\\,dx$ يساوي:',
        options: [
          { key: 'A', text: '$x e^x + e^x + C$' },
          { key: 'B', text: '$x e^x - e^x + C$' },
          { key: 'C', text: '$\\frac{1}{2}x^2 e^x + C$' },
          { key: 'D', text: '$e^x - x + C$' }
        ],
        correctKey: 'B',
        explanation:
          'نفرض $u = x \\implies du = dx$، و $dv = e^x\\,dx \\implies v = e^x$. إذن التكامل $= u v - \\int v\\,du = x e^x - \\int e^x\\,dx = x e^x - e^x + C$.',
        solutionSteps: [
          'نختار $u = x$ للتبسيط بالاشتقاق: $du = dx$.',
          'نختار $dv = e^x\\,dx$ ونكاملها: $v = e^x$.',
          'نعوض في صيغة التجزيء: $u v - \\int v\\,du = x e^x - \\int e^x\\,dx$.',
          'نجري التكامل المتبقي لنحصل على $x e^x - e^x + C$.'
        ],
        hints: [
          'هذا حاصل ضرب كثيرة حدود في دالة أسية؛ نختار الدالة التي تتبسط بالاشتقاق لتكون $u$.',
          'استخدم صيغة التكامل بالتجزيء: $\\int u\\,dv = u v - \\int v\\,du$.',
          'ضع $u = x$ و $dv = e^x\\,dx$ ثم أوجد $du$ و $v$ وعوّض في القانون.'
        ],
        difficulty: 'B',
        targetedLearningOutcome: 'تطبيق التكامل بالتجزيء',
        examSource: 'ثانوية عامة 2023 دور ثان'
      }
    ]
  },
  {
    id: 'unit_calc_03',
    unitNumber: 3,
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    title: 'الوحدة الثالثة: سلوك الدالة وتطبيقات القيم العظمى والصغرى ورسم المنحنيات',
    description:
      'التزايد والتناقص، القيم العظمى والصغرى المحلية والمطلقة، التحدب لأعلى ولأسفل ونقاط الانقلاب، وخطوات رسم المنحنيات العامة.',
    learningOutcomes: [
      'تحديد فترات التزايد والتناقص والنقاط الحرجة من إشارة المشتقة الأولى',
      'تحديد التحدب ونقاط الانقلاب من إشارة المشتقة الثانية',
      'حل المسائل الهندسية للقيم العظمى والصغرى المطلقة'
    ],
    status: 'not_started',
    studyNotesSummary: [
      'النقاط الحرجة: عندما $f\'(x) = 0$ أو غير معرفة مع انتمائها لمجال الدالة.',
      'نقاط الانقلاب: $f\'\'(x) = 0$ وتغير إشارة $f\'\'(x)$ حول النقطة.'
    ],
    localResourcesCount: 5,
    lastUpdatedDate: '2026-10-25',
    practiceQuestions: [
      {
        id: 'pq_calc_3_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText: 'نقطة الانقلاب للمنحنى $y = x^3 - 3x^2 + 5$ هي:',
        options: [
          { key: 'A', text: '$(0, 5)$' },
          { key: 'B', text: '$(1, 3)$' },
          { key: 'C', text: '$(2, 1)$' },
          { key: 'D', text: '$(-1, 1)$' }
        ],
        correctKey: 'B',
        explanation:
          '$y\' = 3x^2 - 6x$ و $y\'\' = 6x - 6 = 0 \\implies x = 1$. بالتعويض في الدالة الأصلية: $y = 1 - 3 + 5 = 3$.',
        difficulty: 'C',
        targetedLearningOutcome: 'إيجاد نقاط الانقلاب',
        examSource: 'ثانوية عامة 2021'
      }
    ]
  },

  // ==========================================
  // STATICS (الاستاتيكا) - PILOT REVIEWED UNIT 1
  // ==========================================
  {
    id: 'unit_stat_01',
    unitNumber: 1,
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    title: 'الوحدة الأولى: الاحتكاك واتزان جسم على مستوى أفقي ومائل خشن',
    description:
      'قوى الاحتكاك السكوني والحركي، معامل الاحتكاك السكوني وزاوية الاحتكاك، رد الفعل المحصل، واتزان جسم على مستوى أفقي أو مائل خشن.',
    learningOutcomes: [
      'التمييز بدقة بين قوة الاحتكاك العادية وقوة الاحتكاك السكوني النهائي $f_s = \\mu_s R$',
      'حساب رد الفعل المحصل وزاوية الاحتكاك $\\lambda$',
      'تحليل القوى على المستوى المائل وإيجاد القوة التي تجعل الجسم على وشك الحركة'
    ],
    status: 'not_started',
    studyNotesSummary: [
      '$f_s = \\mu_s R = \\tan(\\lambda) R$.',
      'رد الفعل المحصل: $R\' = \\sqrt{R^2 + f_s^2} = R\\sqrt{1 + \\mu_s^2} = R\\sec(\\lambda)$.'
    ],
    localResourcesCount: 4,
    lastUpdatedDate: '2026-10-18',
    practiceQuestions: [
      {
        id: 'pq_stat_1_1',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الاستاتيكا - التوجيه الفني',
        reviewedAt: '2026-10-18',
        verifiedBySympy: true,
        questionNumber: 1,
        questionText:
          'جسم وزنه $40\\text{ N}$ موضوع على مستوى أفقي خشن معامل الاحتكاك السكوني بينهما $\\mu_s = 0.25$. فإن أقل قوة أفقية تجعل الجسم على وشك الحركة تساوي:',
        options: [
          { key: 'A', text: '$20\\text{ N}$' },
          { key: 'B', text: '$40\\text{ N}$' },
          { key: 'C', text: '$160\\text{ N}$' },
          { key: 'D', text: '$10\\text{ N}$' }
        ],
        correctKey: 'D',
        explanation:
          'من الاتزان الرأسي: رد الفعل العمودي $R = W = 40\\text{ N}$. القوة الأفقية اللازمة لوشك الحركة تساوي قوة الاحتكاك السكوني النهائي: $F = f_s = \\mu_s R = 0.25 \\times 40 = 10\\text{ N}$.',
        solutionSteps: [
          'نوازن القوى الرأسية على المستوى الأفقي: $R = W = 40\\text{ N}$.',
          'عندما يكون الجسم على وشك الحركة أفقياً فإن $F = f_s = \\mu_s R$.',
          'بالتعويض: $F = 0.25 \\times 40 = 10\\text{ N}$.'
        ],
        hints: [
          'على مستوى أفقي وبقوة أفقية، القوى الرأسية هي الوزن ورد الفعل العمودي فقط.',
          'تذكّر أن أقصى قوة احتكاك سكوني تُعطى بالعلاقة $f_s = \\mu_s R$.',
          'أوجد رد الفعل العمودي $R$ أولاً من الاتزان الرأسي ثم اضربه في معامل الاحتكاك $0.25$.'
        ],
        difficulty: 'C',
        targetedLearningOutcome: 'حساب قوة الاحتكاك النهائي على مستوى أفقي',
        examSource: 'ثانوية عامة 2021 دور ثان'
      }
    ]
  },
  {
    id: 'unit_stat_04',
    unitNumber: 4,
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    title: 'الوحدة الرابعة: الاتزان العام وتطبيقات القضبان والسلالم',
    description:
      'شروط الاتزان العام لجسم صلب وتطبيقات القضبان المرتكزة والمفصلية والسلالم وتحديد ردود الأفعال.',
    learningOutcomes: [
      'تطبيق شروط الاتزان العام: $\\sum F_x = 0$ ، $\\sum F_y = 0$ ، $\\sum M = 0$',
      'حل مسائل السلالم والقضبان المستندة على حوائط رأسية ملساء وأرضيات خشنة'
    ],
    status: 'not_started',
    studyNotesSummary: [
      'شروط الاتزان العام: $\\sum F_x = 0$ و $\\sum F_y = 0$ و $\\sum M_O = 0$.'
    ],
    localResourcesCount: 4,
    lastUpdatedDate: '2026-10-24',
    practiceQuestions: [
      {
        id: 'pq_stat_4_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText:
          'قضيب منتظم $AB$ وزنه $W$ متزن في وضع أفقي على وتدين عند $A$ و $C$ (حيث $C$ تبعد ربع طول القضيب عن $B$). فإن النسبة $R_A : R_C$ تساوي:',
        options: [
          { key: 'A', text: '$2 : 3$' },
          { key: 'B', text: '$1 : 3$' },
          { key: 'C', text: '$1 : 2$' },
          { key: 'D', text: '$1 : 1$' }
        ],
        correctKey: 'C',
        explanation:
          'بأخذ العزوم حول $A$ لطول $4L$: $R_C(3L) = W(2L) \\implies R_C = \\frac{2}{3}W$ و $R_A = \\frac{1}{3}W$.',
        difficulty: 'B',
        targetedLearningOutcome: 'حساب ردود الأفعال في الاتزان العام',
        examSource: 'ثانوية عامة 2023 دور أول'
      }
    ]
  },

  // ==========================================
  // DYNAMICS (الديناميكا) - UNREVIEWED CONTENT GATE TEST UNIT
  // ==========================================
  {
    id: 'unit_dyn_01',
    unitNumber: 1,
    subjectCode: 'DYNAMICS',
    subjectNameAr: 'الديناميكا',
    title: 'الوحدة الأولى: تفاضل وتكامل الدوال المتجهة وكمية الحركة',
    description:
      'متجه الموضع، الإزاحة، السرعة $v = \\frac{dx}{dt}$، العجلة $a = \\frac{dv}{dt} = v\\frac{dv}{dx}$، وكمية الحركة.',
    learningOutcomes: [
      'التفرقة بين العجلة كدالة في الزمن وكدالة في الموضع $a = v\\frac{dv}{dx}$',
      'تطبيق التكامل المحدد لحساب الإزاحة والمسافة الكلية المقطوعة'
    ],
    status: 'not_started',
    studyNotesSummary: [
      'عندما تكون $v$ دالة في $x$ نستخدم $a = v\\frac{dv}{dx}$.'
    ],
    localResourcesCount: 3,
    lastUpdatedDate: '2026-10-15',
    practiceQuestions: [
      {
        id: 'pq_dyn_1_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText:
          'جسيم يتحرك في خط مستقيم بحيث كانت سرعته $v$ تعطى بالعلاقة $v^2 = 9 - x^2$، فإن عجلته $a$ عند $x = 2$ تساوي:',
        options: [
          { key: 'A', text: '$2\\text{ m/s}^2$' },
          { key: 'B', text: '$-2\\text{ m/s}^2$' },
          { key: 'C', text: '$-4\\text{ m/s}^2$' },
          { key: 'D', text: '$5\\text{ m/s}^2$' }
        ],
        correctKey: 'B',
        explanation:
          'باشتقاق الطرفين بالنسبة إلى $x$: $2v\\frac{dv}{dx} = -2x \\implies a = -x = -2\\text{ m/s}^2$.',
        difficulty: 'A',
        targetedLearningOutcome: 'إيجاد العجلة عندما تكون السرعة دالة في الموضع',
        examSource: 'ثانوية عامة 2022 دور أول'
      }
    ]
  },

  // ==========================================
  // PHYSICS (الفيزياء) - UNREVIEWED CONTENT GATE TEST UNIT
  // ==========================================
  {
    id: 'unit_phys_01',
    unitNumber: 1,
    subjectCode: 'PHYSICS',
    subjectNameAr: 'الفيزياء',
    title: 'الفصل الأول: التيار الكهربي وقانون أوم وقوانين كيرشوف',
    description:
      'شدة التيار، فرق الجهد، المقاومة النوعية، قانون أوم للدائرة المغلقة، وقانونا كيرشوف.',
    learningOutcomes: [
      'حساب المقاومة المكافئة للدائرة وإيجاد التيارات',
      'تطبيق قانون أوم للدائرة المغلقة $V = V_B - I r$'
    ],
    status: 'not_started',
    studyNotesSummary: [
      '$R = \\rho_e \\frac{L}{A}$ و $\\sigma = \\frac{1}{\\rho_e}$.'
    ],
    localResourcesCount: 4,
    lastUpdatedDate: '2026-10-23',
    practiceQuestions: [
      {
        id: 'pq_phys_1_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText:
          'سُحب سلك معدني بانتظام حتى زاد طوله بنسبة $50\\%$ من طوله الأصلي، فإن مقاومته الكهربية تصبح:',
        options: [
          { key: 'A', text: '$0.5$ من قيمتها الأصلية' },
          { key: 'B', text: '$1.5$ من قيمتها الأصلية' },
          { key: 'C', text: '$3$ من قيمتها الأصلية' },
          { key: 'D', text: '$2.25$ من قيمتها الأصلية' }
        ],
        correctKey: 'D',
        explanation:
          'بثبات الحجم: $L_2 = 1.5 L_1$ و $A_2 = \\frac{A_1}{1.5}$، وبالتالي $R_2 / R_1 = (1.5)^2 = 2.25$.',
        difficulty: 'B',
        targetedLearningOutcome: 'تأثير سحب وتشكيل السلك على المقاومة',
        examSource: 'ثانوية عامة 2021 دور أول'
      }
    ]
  }
];

export const initialMonthlyExams: MonthlyExam[] = [
  {
    id: 'exam_oct_2026',
    monthName: 'اختبار شهر أكتوبر ٢٠٢٦ (مراجَع)',
    targetMonth: '2026-10',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل والاستاتيكا',
    title: 'الاختبار التشخيصي لشهر أكتوبر: اشتقاق الدوال المثلثية والاحتكاك',
    durationMinutes: 45,
    totalMarks: 20,
    isCompleted: false,
    questions: [
      {
        id: 'mq_oct_1',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الرياضيات - التوجيه الفني',
        reviewedAt: '2026-10-20',
        verifiedBySympy: true,
        questionNumber: 1,
        questionText: 'إذا كانت $y = \\sec(x)\\tan(x)$، فإن $\\frac{dy}{dx}$ عند $x = 0$ تساوي:',
        options: [
          { key: 'A', text: '$0$' },
          { key: 'B', text: '$1$' },
          { key: 'C', text: '$2$' },
          { key: 'D', text: '$-1$' }
        ],
        correctKey: 'B',
        explanation:
          'بقاعدة مشتقة الضرب: $\\frac{dy}{dx} = \\sec(x)\\tan^2(x) + \\sec^3(x)$. عند $x = 0$: $\\tan(0) = 0$ و $\\sec(0) = 1$، إذن الناتج $0 + 1^3 = 1$.',
        solutionSteps: [
          'طبق قاعدة مشتقة حاصل ضرب دالتين: $(fg)\' = f\'g + fg\'$.',
          'مشتقة $\\sec x$ هي $\\sec x \\tan x$، ومشتقة $\\tan x$ هي $\\sec^2 x$.',
          'إذن $\\frac{dy}{dx} = \\sec x \\tan^2 x + \\sec^3 x$.',
          'بالتعويض عند $x = 0$: $1 \\cdot 0^2 + 1^3 = 1$.'
        ],
        hints: [
          'هذه الدالة حاصل ضرب دالتين مثلثيتين: $\\sec x$ و $\\tan x$.',
          'استخدم قاعدة مشتقة الضرب مع $\\frac{d}{dx}(\\sec x) = \\sec x \\tan x$ و $\\frac{d}{dx}(\\tan x) = \\sec^2 x$.',
          'اكتب المشتقة بدلالة $\\sec x$ و $\\tan x$ ثم عوض بـ $x = 0$ حيث $\\cos(0)=1$ و $\\sin(0)=0$.'
        ],
        difficulty: 'C',
        targetedLearningOutcome: 'مشتقة حاصل ضرب دالتين مثلثيتين'
      },
      {
        id: 'mq_oct_2',
        questionVersion: 1,
        reviewStatus: 'reviewed',
        reviewedBy: 'لجنة مراجعة الاستاتيكا - التوجيه الفني',
        reviewedAt: '2026-10-20',
        verifiedBySympy: true,
        questionNumber: 2,
        questionText:
          'جسم وزنه $60\\text{ kg.wt}$ موضوع على مستوى خشن يميل على الأفقي بزاوية $30^\\circ$، فإذا كان معامل الاحتكاك السكوني $\\mu_s = \\frac{\\sqrt{3}}{3}$، فإن القوة الموازية لخط أكبر ميل وتجعل الجسم على وشك الحركة لأعلى تساوي:',
        options: [
          { key: 'A', text: '$40\\text{ kg.wt}$' },
          { key: 'B', text: '$30\\text{ kg.wt}$' },
          { key: 'C', text: '$60\\text{ kg.wt}$' },
          { key: 'D', text: '$50\\text{ kg.wt}$' }
        ],
        correctKey: 'C',
        explanation:
          '$R = 60\\cos 30^\\circ = 30\\sqrt{3}$، وقوة الاحتكاك $f_s = \\frac{\\sqrt{3}}{3}\\cdot 30\\sqrt{3} = 30$. إذن $P = 60\\sin 30^\\circ + f_s = 30 + 30 = 60\\text{ kg.wt}$.',
        solutionSteps: [
          'حلل الوزن $W = 60$ إلى مركبتين: $60\\cos 30^\\circ$ عمودية و $60\\sin 30^\\circ$ موازية للمستوى لأسفل.',
          'أوجد رد الفعل العمودي: $R = 60\\cos 30^\\circ = 30\\sqrt{3}$.',
          'احسب قوة الاحتكاك السكوني النهائي لأسفل: $f_s = \\mu_s R = \\frac{\\sqrt{3}}{3}(30\\sqrt{3}) = 30$.',
          'اجمع القوتين المؤثرتين لأسفل لإيجاد القوة لأعلى: $P = 60(0.5) + 30 = 60\\text{ kg.wt}$.'
        ],
        hints: [
          'عندما يكون الجسم على وشك الحركة لأعلى، يكون اتجاه قوة الاحتكاك السكوني لأسفل المستوى.',
          'القوة الموازية لأعلى تساوي مجموع مركبة الوزن لأسفل وقوة الاحتكاك: $P = W\\sin\\theta + \\mu_s W\\cos\\theta$.',
          'احسب $R = 60\\cos 30^\\circ$ ثم اضربها في $\\frac{\\sqrt{3}}{3}$ قبل جمعها مع $60\\sin 30^\\circ$.'
        ],
        difficulty: 'B',
        targetedLearningOutcome: 'اتزان جسم على مستوى مائل خشن'
      }
    ]
  },
  {
    id: 'exam_nov_2026',
    monthName: 'اختبار شهر نوفمبر ٢٠٢٦ (قيد المراجعة)',
    targetMonth: '2026-11',
    subjectCode: 'DYNAMICS',
    subjectNameAr: 'الديناميكا والفيزياء',
    title: 'اختبار نوفمبر التقييمي: الدوال المتجهة وقوانين نيوتن',
    durationMinutes: 60,
    totalMarks: 25,
    isCompleted: false,
    questions: [
      {
        id: 'mq_nov_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText:
          'قطار كتلته $200$ طن يتحرك على طريق أفقي بسرعة منتظمة $72\\text{ km/h}$ ضد مقاومات تعادل $5\\text{ kg.wt}$ لكل طن، فإن قدرة آلة القطار بالحصان تساوي تقريباً:',
        options: [
          { key: 'A', text: '$150$ حصان' },
          { key: 'B', text: '$200$ حصان' },
          { key: 'C', text: '$266.7$ حصان' },
          { key: 'D', text: '$350$ حصان' }
        ],
        correctKey: 'C',
        explanation:
          'السرعة $v = 72 \\times \\frac{5}{18} = 20\\text{ m/s}$، والمقاومة $R = 1000\\text{ kg.wt}$، إذن القدرة $= \\frac{1000 \\times 20}{75} \\approx 266.7$ حصان.',
        difficulty: 'B',
        targetedLearningOutcome: 'حساب القدرة بالحصان في الحركة المنتظمة'
      }
    ]
  },
  {
    id: 'exam_midyear_2027',
    monthName: 'اختبار نصف العام (قيد المراجعة)',
    targetMonth: '2027-01',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'الرياضيات البحتة والتطبيقية',
    title: 'مراجعة منتصف العام: ذات الحدين والتفاضل',
    durationMinutes: 120,
    totalMarks: 60,
    isCompleted: false,
    questions: [
      {
        id: 'mq_mid_1',
        questionVersion: 1,
        reviewStatus: 'unreviewed',
        questionNumber: 1,
        questionText: 'في مفكوك $(x + \\frac{1}{x})^{10}$، الحد الخالي من $x$ هو الحد رقم:',
        options: [
          { key: 'A', text: 'الخامس ($T_5$)' },
          { key: 'B', text: 'السادس ($T_6$)' },
          { key: 'C', text: 'السابع ($T_7$)' },
          { key: 'D', text: 'الرابع ($T_4$)' }
        ],
        correctKey: 'B',
        explanation:
          'الحد العام $T_{r+1} = \\binom{10}{r} x^{10-2r}$؛ وبوضع $10 - 2r = 0$ ينتج $r = 5$ أي الحد السادس.',
        difficulty: 'C',
        targetedLearningOutcome: 'نظرية ذات الحدين وإيجاد الحد الخالي من المتغير'
      }
    ]
  }
];
