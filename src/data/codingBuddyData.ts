export interface CodingTrickItem {
  id: string;
  title: string;
  category: 'python' | 'javascript' | 'web' | 'math_to_code' | 'logic_fun';
  categoryLabelAr: string;
  badge: string;
  emoji: string;
  summary: string;
  funAnalogy: string;
  code: string;
  language: 'python' | 'javascript' | 'html';
  output: string;
  whyItWorks: string;
  beginnerPitfall: string; // فخ يقع فيه المبتدئ
  mathLink?: string; // ربط بالرياضيات والمنهج
  toolAction?: {
    label: string;
    targetService: string;
  };
}

export interface CodingPuzzle {
  id: string;
  question: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funReactionWin: string;
  funReactionLose: string;
  xpPoints: number;
}

export interface CuratedResource {
  id: string;
  name: string;
  language: 'AR' | 'EN';
  category: 'platform' | 'youtube' | 'interactive' | 'cheat_sheets' | 'games';
  categoryLabelAr: string;
  url: string;
  description: string;
  whyItsAwesome: string;
  difficulty: 'مبتدئ تماماً (Zero)' | 'سهل وممتع' | 'تطبيقي ترفيهي';
  rating: number; // 4.8, 5.0
  tags: string[];
  isFree: boolean;
}

export const CODING_TRICKS: CodingTrickItem[] = [
  {
    id: 'trick_py_swap',
    title: 'تريكة تبديل المتغيرات السحري في سطر واحد',
    category: 'python',
    categoryLabelAr: 'بايثون سريعة',
    badge: 'تريكة كلاسيكية ⚡',
    emoji: '🪄',
    summary: 'بدل قيمتين بين متغيرين بدون ما تضيع وقتك في متغير تالت زي اللغات القديمة!',
    funAnalogy: 'تخيل معاك كباية عصير مانجو وكباية فراولة.. في بايثون بتقولهم: بدلو مع بعض، يبدلوا فوراً!',
    code: `hero = "باتمان"
villain = "الجوكر"

# السحر هنا بدون متغير temp:
hero, villain = villain, hero

print(f"البطل الجديد: {hero}")
print(f"الشرير الجديد: {villain}")`,
    language: 'python',
    output: `البطل الجديد: الجوكر
الشرير الجديد: باتمان`,
    whyItWorks: 'بايثون بتعمل حاجة اسمها Tuple Unpacking، فبتحفظ القيمتين مؤقتاً في الذاكرة وتبدلهم في خطوة واحدة ذرية.',
    beginnerPitfall: 'في لغات زي C++ لو عملت hero = villain من غير temp، قيمة hero الأصلية بتضيع في الهواء!',
    mathLink: 'نفس فكرة تبديل الصفوف والأعمدة في محددات ومصفوفات الجبر الفراغي!'
  },
  {
    id: 'trick_py_list_comp',
    title: 'مصفاة القوائم الذكية (List Comprehension)',
    category: 'python',
    categoryLabelAr: 'بايثون سريعة',
    badge: 'سحرية وممتعة 🎯',
    emoji: '🍕',
    summary: 'اكتب حلقة تكرار وفلتر شرطي كامل في سطر واحد شيك!',
    funAnalogy: 'زي لما تطلب بيتزا وتقول للشيف: هاتلي بس القطع اللي عليها جبنة زيادة وشيل الزيتون في نفس الطبق.',
    code: `scores = [45, 88, 92, 53, 76, 30, 99]

# هات كل الدرجات اللي فوق الـ 75 واضربها في بونص:
top_students = [score + 5 for score in scores if score >= 75]

print("درجات الشطار مع البونص:", top_students)`,
    language: 'python',
    output: `درجات الشطار مع البونص: [93, 97, 81, 104]`,
    whyItWorks: 'بايثون بتدمج الـ loop مع الـ if داخل أقواس الـ list مباشرة [تعبير for عنصر in قائمة if شرط].',
    beginnerPitfall: 'لا تكتب أكثر من شرطين داخل نفس السطر عشان كودك يفضل مقروء ومريح للعين.',
    mathLink: 'تطابق تماماً تعريف المجموعات الرياضية بالصفة المميزة: { x + 5 : x ∈ S , x ≥ 75 }.'
  },
  {
    id: 'trick_math_slope',
    title: 'حساب ميل المماس (المشتقة dy/dx) بكود بايثون في ثانيتين',
    category: 'math_to_code',
    categoryLabelAr: 'رياضيات بكود برمجي',
    badge: 'تفاضل بالبرمجة 📐',
    emoji: '📈',
    summary: 'ازاي تحول تعريف المشتقة الأولى في التفاضل لكود يحسب الميل عند أي نقطة!',
    funAnalogy: 'المشتقة هي معدل التغير.. في الكود بناخد خطوة نمنومة جداً (h = 0.0001) ونشوف المنحنى علي كام!',
    code: `def f(x):
    # دالة مثلاً: ص = س² + ٣س
    return x**2 + 3*x

def derivative(f, x, h=1e-5):
    # قانون نهاية معدل التغير الشهير: [د(س+هـ) - د(س)] / هـ
    return (f(x + h) - f(x)) / h

x_target = 2
slope = derivative(f, x_target)

print(f"ميل المماس عند س={x_target} هو تقريباً: {round(slope, 2)}")
# بالقواعد: مشتقة (س² + ٣س) = ٢س + ٣ = ٢(٢) + ٣ = ٧`,
    language: 'python',
    output: `ميل المماس عند س=2 هو تقريباً: 7.0`,
    whyItWorks: 'الكمبيوتر بيحسب النهاية lim عند اقتراب h من الصفر عددياً (Numerical Differentiation) بدقة فائقة.',
    beginnerPitfall: 'لو خليت h = 0 الكمبيوتر هيصرخ ZeroDivisionError لأن القسمة على صفر ممنوعة في الرياضيات والبرمجة!',
    mathLink: 'تطبيق مباشر لقانون معدل التغير في أول درس تفاضل بالثانوية العامة.'
  },
  {
    id: 'trick_js_destruct',
    title: 'سحب البيانات بالملعقة (JS Object Destructuring)',
    category: 'javascript',
    categoryLabelAr: 'جافاسكريبت ممتعة',
    badge: 'احترافية الويب 🌐',
    emoji: '🥄',
    summary: 'استخرج الخواص اللي محتاجها من أي كائن كبير بأسماء مباشرة!',
    funAnalogy: 'تخيل طلبت وجبة كومبو، وإنت بس عايز البطاطس والبيبسي من غير ما تمسك الساندوتش.',
    code: `const student = {
  name: "أحمد",
  section: "علمي رياضة",
  targetScore: 98.5,
  favoriteSubject: "تفاضل وتكامل"
};

// بدل student.name و student.targetScore:
const { name, targetScore } = student;

console.log(\`يا \${name}، مجموع أحلامك هو \${targetScore}% إن شاء الله!\`);`,
    language: 'javascript',
    output: `يا أحمد، مجموع أحلامك هو 98.5% إن شاء الله!`,
    whyItWorks: 'ميزة في JavaScript الحديثة (ES6) بتطابق أسماء المفاتيح داخل الأقواس المعقوفة وتنشئ متغيرات فورية.',
    beginnerPitfall: 'لازم اسم المتغير يطابق حرفياً اسم الخاصية داخل الـ Object إلا لو استخدمت alias زي { name: studentName }.'
  },
  {
    id: 'trick_py_fstring',
    title: 'طباعة النصوص الشيك بالـ f-strings الفخمة',
    category: 'python',
    categoryLabelAr: 'بايثون سريعة',
    badge: 'نظافة الكود ✨',
    emoji: '💬',
    summary: 'انسَ علامات + والتحويل لـ str()، ادمج أي عملية حسابية جوة النص مباشرة!',
    funAnalogy: 'زي لما تحط صورة أو ستيكر في وسط رسالة واتساب، بتدخل ناعمة ومظبوطة في مكانها.',
    code: `price = 150
discount = 0.20 # خصم ٢٠٪

# اكتب المعادلة جوة القوس المعقوف فوراً:
print(f"السعر الأصلي: {price} ج | بعد الخصم: {price * (1 - discount):.1f} ج فقط!")`,
    language: 'python',
    output: `السعر الأصلي: 150 ج | بعد الخصم: 120.0 ج فقط!`,
    whyItWorks: 'حرف f قبل علامة التنصيص يخبر بايثون بتنفيذ أي كود يقع بين { } ودمجه كنص منسق.',
    beginnerPitfall: 'نسيان حرف f قبل علامة التنصيص هيطبع الأقواس كما هي {price} كنص عادي دون تعويض قيمتها.'
  },
  {
    id: 'trick_web_css_center',
    title: 'توسيط العنصر في شاشة الويب (حل معضلة المبرمجين التاريخية!)',
    category: 'web',
    categoryLabelAr: 'تطوير الويب',
    badge: 'تريكة تاريخية 🏆',
    emoji: '🎯',
    summary: 'كيف تضع أي مربع أو زرار في منتصف الشاشة أفقياً ورأسياً بسطرين CSS!',
    funAnalogy: 'تخيل لوحة متعلقة في الصالة، عايزها في السنتر بالظبط بدون مسطرة وخناقات!',
    code: `/* في CSS الحديث مع Flexbox أو Grid */
.container {
  display: grid;
  place-items: center; /* بس كده! أفقي ورأسي في ثانية واحدة */
  min-height: 100vh;
}

/* أو باستخدام Flexbox: */
.container-flex {
  display: flex;
  justify-content: center; /* أفقياً */
  align-items: center;     /* رأسياً */
}`,
    language: 'html',
    output: `العنصر أصبح في منتصف الشاشة بنسبة 100% رياضياً وبصرياً!`,
    whyItWorks: 'خاصية place-items: center هي اختصار ذكي يجمع justify-items و align-items في أمر واحد مريح.',
    beginnerPitfall: 'لو نسيت تحط ارتفاع للأب مثل min-height: 100vh، العنصر هيتوسط أفقياً فقط ومش رأسياً لأن الأب ملوش طول.'
  }
];

export const CODING_PUZZLES: CodingPuzzle[] = [
  {
    id: 'puzzle_1',
    question: 'توقع ناتج كود بايثون التالي: ماذا يحدث عند ضرب كلمة في رقم؟',
    code: `word = "ها"
result = word * 3 + "!"
print(result)`,
    options: ['ها3!', 'هاهاها!', 'خطأ TypeError', 'ها ها ها !'],
    correctIndex: 1,
    explanation: 'في بايثون، ضرب النصوص (String Repetition) في رقم صحيح بيكرر النص بعدد المرات! زي صدى الصوت بالظبط.',
    funReactionWin: 'يا عيني عليك! كودر أصلي وفاهم ألاعيب بايثون! 🥳🚀',
    funReactionLose: 'أوبس! في بايثون الضرب مع الكلمات بيعمل تكرار مش ضرب حسابي! جرب اللغز اللي بعده 🧐',
    xpPoints: 15
  },
  {
    id: 'puzzle_2',
    question: 'ماذا يطبع هذا الكود في بايثون مع القوائم السلبية؟',
    code: `fruits = ["تفاح", "موز", "مانجو", "فراولة"]
print(fruits[-1])`,
    options: ['تفاح', 'موز', 'فراولة', 'خطأ IndexOutOfBounds'],
    correctIndex: 2,
    explanation: 'الرقم السالب في فهارس بايثون بيبدأ العد من الآخر بالعكس! فـ -1 يعني العنصر الأخير مباشرة.',
    funReactionWin: 'برافو! تريكة المؤشرات السالبة دي بتوفر أسطر كود كاملة! 🌟',
    funReactionLose: 'انتبه! بايثون عبقرية: السالب بيلف من ورا وياخد آخر عنصر "فراولة" 🍓',
    xpPoints: 20
  },
  {
    id: 'puzzle_3',
    question: 'ما هو ناتج التعبير الشرطي الممتع ده في بايثون؟',
    code: `x = 10
status = "شاطر" if x >= 10 else "حاول تاني"
print(status)`,
    options: ['حاول تاني', 'شاطر', 'خطأ نحوي SyntaxError', '10'],
    correctIndex: 1,
    explanation: 'ده اسمه Ternary Operator (الشرط المختصر في سطر واحد). بما أن x = 10 والشرط >= 10 تحقق، فالناتج "شاطر"!',
    funReactionWin: 'إجابة صاروخية! إنت جاهز تعمل مشاريع حقيقية يا بطل! 🎯🔥',
    funReactionLose: 'الشرط x >= 10 صحيح، فبياخد أول قيمة على الشمال "شاطر" 💡',
    xpPoints: 20
  },
  {
    id: 'puzzle_4',
    question: 'في جافاسكريبت، ماذا يطبع التعبير الشهير الآتي؟',
    code: `const a = "5";
const b = 2;
console.log(a + b);`,
    options: ['7', '"52"', 'NaN', 'خطأ في النوع'],
    correctIndex: 1,
    explanation: 'علامة + لما تقابل نص (String) مع رقم، جافاسكريبت بتدمجهم جنباً إلى جنب ككلام فتبقى "52"!',
    funReactionWin: 'كشفت فخ جافاسكريبت الأكبر في التاريخ! عبقري! 🧠⚡',
    funReactionLose: 'فخ كلاسيكي! جافاسكريبت بتلزق الكلمات بالـ + فتبقى "52" بدل ما تجمعهم! 😅',
    xpPoints: 25
  }
];

export const CURATED_RESOURCES: CuratedResource[] = [
  // ARABIC PLATFORMS
  {
    id: 'res_harmash',
    name: 'موقع هرمش (Harmash.com)',
    language: 'AR',
    category: 'platform',
    categoryLabelAr: 'منصات ومواقع عربية',
    url: 'https://harmash.com',
    description: 'أبسط وأوضح موسوعة عربية مجانية لشرح لغات البرمجة (بايثون، جافا، HTML/CSS، قواعد البيانات) خطوة بخطوة باللغة العربية الفصحى السهلة.',
    whyItsAwesome: 'شرح مع أمثلة مباشرة وكود قابل للنسخ والتجربة، مصمم خصيصاً للمبتدئ بدون أي تعقيد.',
    difficulty: 'مبتدئ تماماً (Zero)',
    rating: 4.9,
    tags: ['بايثون بالعربي', 'شروحات مبسطة', 'مجاني 100%', 'مبتدئين'],
    isFree: true
  },
  {
    id: 'res_elzero',
    name: 'أكاديمية أسامة الزيرو (Elzero Web School)',
    language: 'AR',
    category: 'youtube',
    categoryLabelAr: 'قنوات ومسارات تفاعلية',
    url: 'https://elzero.org',
    description: 'الأشهر عربياً لتعلم تطوير الويب من الصفر (HTML, CSS, JavaScript, Python). أسلوب أسامة الزيرو يتميز بروح الدعابة، والوضوح، والتطبيقات العملية.',
    whyItsAwesome: 'مسارات منظمة، تكليفات وتحديات بعد كل درس، ومجتمع كبير للإجابة على الأسئلة.',
    difficulty: 'سهل وممتع',
    rating: 5.0,
    tags: ['تطوير الويب', 'جافاسكريبت', 'يوتيوب وتكليفات', 'مشاريع حقيقية'],
    isFree: true
  },
  {
    id: 'res_satr',
    name: 'منصة سطر التعليمية (Satr.codes)',
    language: 'AR',
    category: 'platform',
    categoryLabelAr: 'منصات ومواقع عربية',
    url: 'https://satr.codes',
    description: 'منصة تفاعلية عربية حديثة مدعومة من الاتحاد السعودي للأمن السيبراني والبرمجة، تقدم مسارات فيديو وتطبيق عملي من المتصفح مباشرة.',
    whyItsAwesome: 'مسارات بايثون وأساسيات البرمجة قصيرة وممتعة مع شهادات إتمام مجانية.',
    difficulty: 'مبتدئ تماماً (Zero)',
    rating: 4.8,
    tags: ['منصة تفاعلية', 'بايثون للمبتدئين', 'تطبيق مباشر', 'شهادات'],
    isFree: true
  },
  {
    id: 'res_hsoub',
    name: 'موسوعة حسوب وأكاديمية حسوب (Hsoub)',
    language: 'AR',
    category: 'platform',
    categoryLabelAr: 'منصات ومواقع عربية',
    url: 'https://wiki.hsoub.com',
    description: 'مرجع وموسوعة توثيقية باللغة العربية تشرح كل الدوال والأوامر في أغلب لغات البرمجة مع شروحات ومقالات ثرية للمبتدئين.',
    whyItsAwesome: 'أفضل قاموس ومرجع ترجع له لما تقف في كود أو تحتاج تعرف وظيفة دالة معينة.',
    difficulty: 'سهل وممتع',
    rating: 4.8,
    tags: ['مرجع لغات', 'توثيق عربي', 'مقالات للمبتدئين'],
    isFree: true
  },

  // INTERNATIONAL EASY PLATFORMS
  {
    id: 'res_w3schools',
    name: 'W3Schools (موقع الملايين التفاعلي)',
    language: 'EN',
    category: 'interactive',
    categoryLabelAr: 'مواقع تفاعلية عالمية سهلة',
    url: 'https://www.w3schools.com',
    description: 'أسهل موقع في العالم لتعلم أي لغة برمجة بلغة إنجليزية بسيطة جداً مع زر "Try it Yourself" لتجربة وتعديل الكود في نفس اللحظة.',
    whyItsAwesome: 'ماتريال خفيفة جداً، الشرح في صفحة واحدة لا تتجاوز 10 أسطر، مع إمكانية تجربة كل كود أونلاين فوراً.',
    difficulty: 'مبتدئ تماماً (Zero)',
    rating: 4.9,
    tags: ['محرر كود فوري', 'إنجليزي سهل جداً', 'Python & Web', 'أسهل مراجع'],
    isFree: true
  },
  {
    id: 'res_freecodecamp',
    name: 'freeCodeCamp (التفاعلي بالكامل)',
    language: 'EN',
    category: 'interactive',
    categoryLabelAr: 'مواقع تفاعلية عالمية سهلة',
    url: 'https://www.freecodecamp.org',
    description: 'أضخم منصة تعليمية غير ربحية في العالم، تبدأ معك من أول سطر كود وتطلب منك كتابة الكود وحل المهام خطوة بخطوة في المتصفح.',
    whyItsAwesome: 'تعليم بالممارسة الحقيقية (Learning by doing) مع مشاريع عملية لبناء بورتفوليو حقيقي.',
    difficulty: 'سهل وممتع',
    rating: 5.0,
    tags: ['تفاعلي 100%', 'مشاريع حقيقية', 'شهادات معتمدة', 'شامل'],
    isFree: true
  },
  {
    id: 'res_programiz',
    name: 'Programiz (بايثون وأساسيات للمبتدئين)',
    language: 'EN',
    category: 'interactive',
    categoryLabelAr: 'مواقع تفاعلية عالمية سهلة',
    url: 'https://www.programiz.com',
    description: 'منصة مخصصة لتعليم بايثون و C للمبتدئين برسومات ومخططات بيانية توضيحية تشرح ماذا يحدث داخل ذاكرة الكمبيوتر.',
    whyItsAwesome: 'شرح مصور بالأشكال والرسوم التوضيحية البسيطة مع محرر بايثون مدمج.',
    difficulty: 'مبتدئ تماماً (Zero)',
    rating: 4.8,
    tags: ['شرح بالرسوم', 'بايثون سهلة', 'محرر مدمج'],
    isFree: true
  },
  {
    id: 'res_games_codecombat',
    name: 'CodeCombat & CodinGame (ألعاب برمجة ترفيهية)',
    language: 'EN',
    category: 'games',
    categoryLabelAr: 'ألعاب برمجية ترفيهية',
    url: 'https://codecombat.com',
    description: 'لعبة آر بي جي (RPG) حقيقية تتحكم في البطل وتحارب الوحوش بكتابة أسطر بايثون وجافاسكريبت!',
    whyItsAwesome: 'تحول دراسة البرمجة إلى لعبة شيقة جداً تكسب فيها دروع وأسلحة كلما كتبت كوداً صحيحاً.',
    difficulty: 'تطبيقي ترفيهي',
    rating: 4.9,
    tags: ['لعبة حقيقية', 'ترفيه وتعليم', 'بايثون بالألعاب', 'للمبتدئين والشباب'],
    isFree: true
  }
];

export const SANDBOX_DEMOS = [
  {
    id: 'demo_calc_roots',
    title: 'حل معادلة الدرجة الثانية بالدستور العام',
    description: 'شاهد كيف نحول قانون الدستور العام بالجبر لكود بايثون سريع يحسب جذري المعادلة:',
    code: `import math

# المعادلة: أ س² + ب س + ج = ٠
a = 1
b = -5
c = 6

# المميز Δ = ب² - ٤ أ ج
discriminant = b**2 - 4*a*c

if discriminant >= 0:
    root1 = (-b + math.sqrt(discriminant)) / (2*a)
    root2 = (-b - math.sqrt(discriminant)) / (2*a)
    print(f"المميز = {discriminant} (جذران حقيقيان)")
    print(f"الجذر الأول: س = {root1}")
    print(f"الجذر الثاني: س = {root2}")
else:
    print("المميز سالب: الجذران مركبان!")`,
    language: 'python'
  },
  {
    id: 'demo_fibonacci',
    title: 'متتالية فيبوناتشي السحرية (رياضيات الطبيعة)',
    description: 'توليد أرقام فيبوناتشي حيث كل رقم هو حاصل جمع الرقمين السابقين:',
    code: `def get_fibonacci(n):
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

n = 10
fib = get_fibonacci(n)
print(f"أول {n} أرقام في المتتالية:")
print(fib)
print(f"النسبة الذهبية التقريبية: {fib[-1] / fib[-2]:.4f}")`,
    language: 'python'
  },
  {
    id: 'demo_password_gen',
    title: 'مولد كلمات مرور قوية في ٥ أسطر',
    description: 'أداة مساعدة تولد رمز حماية عشوائي مشفر:',
    code: `import random
import string

chars = string.ascii_letters + string.digits + "!@#$%^&*"
length = 12

password = "".join(random.choice(chars) for _ in range(length))
print(f"كلمة المرور الآمنة المقترحة: {password}")
print(f"طول الكلمة: {len(password)} حرف ورمز")`,
    language: 'python'
  }
];
