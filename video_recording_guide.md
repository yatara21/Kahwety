# 🎥 دليل تصوير العرض التجريبي للمشروع (Stakeholder Demo & Video Recording Guide)
**مشروع منصة قهوتي (Kahwety Cafe Platform) — لوحة التحكم وواجهة الـ API**

---

## 📌 ١. الإعداد الفني قبل التسجيل (Technical & Pre-Recording Setup)

### مواصفات الفيديو الموصى بها (Recommended Video Specs):
* **الدقة (Resolution):** `1920 × 1080` (Full HD 1080p).
* **معدل الإطارات (Framerate):** 60 إطار في الثانية (60 FPS) لحركة مؤشر وسلاسة تامة.
* **المتصفح (Browser):** Google Chrome أو Microsoft Edge في وضع ملء الشاشة أو نافذة نظيفة:
  - إخفاء شريط الإشارات المرجعية (`Ctrl + Shift + B`).
  - نسبة التكبير (Zoom): `100%` (أو `110%` إذا كانت الشاشة 4K/عالية الدقة).
  - استخدام نافذة تصفح خاصة (Incognito) أو نافذة نظيفة خالية من التبويبات المشتتة.
* **برنامج التسجيل المفضل:** OBS Studio أو Loom أو Camtasia مع تفعيل ميزة إبراز نقرات الماوس (Mouse Click Highlight).
* **الصوت:** ميكروفون نقي ومحيط هادئ، أو يمكن التسجيل أولاً ثم تسجيل التعليق الصوتي لاحقاً بناءً على التوقيتات أدناه.

---

## ⚡ ٢. خطة التشغيل المسبق والتحقق (Pre-Flight Startup Checklist)

قبل بدء التسجيل، تأكد من تشغيل الخادمين وتغذية البيانات التجريبية:

```bash
# 1. تفعيل البيئة الافتراضية للبايثون
.venv\Scripts\activate

# 2. تطبيق أحدث ترحيلات قاعدة البيانات (Alembic)
alembic upgrade head

# 3. تغذية قاعدة البيانات بالبيانات التجريبية الواقعية (سوبر أدمن، مقاهي، فروع، منتجات، عروض، اشتراكات، إشعارات)
python scripts/seed_demo_data.py

# 4. تشغيل خادم الواجهة الخلفية (FastAPI API Server) على المنفذ 8000
uvicorn app.main:app --reload --port 8000
```

في نافذة طرفية ثانية (Terminal 2):
```bash
# 5. تشغيل واجهة لوحة التحكم (Frontend Vite Server)
cd frontend
npm run dev
```

* افتح المتصفح على: `http://localhost:5173`
* بيانات تسجيل الدخول للمدير التنفيذي:
  - **البريد الإلكتروني:** `admin@cafe.com`
  - **كلمة المرور:** `Admin123!`

---

## ⏱️ ٣. جدول المشاهد والنص ثنائي اللغة (8–10 Minutes Bilingual Storyboard)

| التوقيت (Time) | الشاشة / الإجراء (Action & Screen) | النص العربي للتسجيل (Arabic Spoken Script) | English Executive Script |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:45** | **صفحة الدخول** (`/login`)<br>- إدخال بيانات `admin@cafe.com`<br>- الضغط على "تسجيل الدخول". | "أهلاً بكم في هذا العرض التوضيحي الشامل لمنصة **قهوتي (Kahwety)**. المنصة مصممة لتكون الرابط التقني الذكي بين عشاق القهوة، المقاهي الشريكة، وفريق إدارة العمليات. نبدأ بتسجيل الدخول كمدير نظام (Super Admin) بصلاحيات كاملة ونظام حماية JWT مشفر." | "Welcome to this comprehensive walkthrough of the **Kahwety Cafe Platform**. Today, we demonstrate the admin operations suite and the underlying API architecture. We begin by logging in as the Super Admin, protected by secure JWT authentication and granular role controls." |
| **0:45 - 2:00** | **لوحة التحكم الرئيسية** (`/`)<br>- الإشارة لمؤشرات الأرقام العلوية.<br>- استعراض مخطط توزيع المدن.<br>- الضغط على زر "إرسال إشعار" الأحمر لإظهار النافذة المنبثقة ثم إغلاقها. | "تستقبلنا لوحة التحكم الموحدة بمؤشرات فورية دقيقة: إجمالي العملاء، ملاك المقاهي المسجلين، الاشتراكات النشطة، ومعدل نمو المقاهي. نلاحظ هنا مخطط التوزيع الجغرافي الواقعي للمقاهي عبر مدن المملكة الرئيسية كالرياض، جدة، والخبر. كذلك يتيح الزر العلوي السريع إرسال تنبيه فوري لكافة المستخدمين أو الملاك بضغطة واحدة." | "Here on the Executive Dashboard, key business metrics are displayed live: total active users, partner cafe registrations, recurring subscriptions, and revenue. Notice the Saudi cities distribution chart reflecting real branch data across Riyadh, Jeddah, and the Eastern Province. The quick-action button at the top right enables instant broadcast notifications to the whole ecosystem." |
| **2:00 - 3:15** | **المقاهي المقترحة** (`/suggested-cafes`)<br>- استعراض القائمة.<br>- إظهار بطاقة "جديد" و"تم التحقق".<br>- استعراض الملاحظات وروابط التواصل. | "من أهم مميزات المنصة قناة استقطاب المقاهي الذكية؛ حيث يرسل المستخدمون اقتراحات للمقاهي المفضلة لديهم. في هذه الشاشة نرى دورة حياة الطلب من حالة (جديد) إلى (تم الإرسال) و(معتمد)، مع وجود تفاصيل المالك، المدينة، الروابط الميدانية، وملاحظات فريق التحقق." | "A core growth engine of Kahwety is the crowdsourced Cafe Suggestions pipeline. Users submit recommended cafes, which enter this triage queue with statuses like NEW, SENT, and APPROVED. Operations teams review verify contact details, social links, and internal notes before converting them to official partners." |
| **3:15 - 4:15** | **إدارة المقاهي والاعتماد الفوري** (`/cafes`)<br>- استعراض قائمة المقاهي.<br>- الإشارة إلى مقهى "واحة القهوة" بحالة (قيد المراجعة).<br>- الضغط على زر اعتماد/تفعيل المقهى مباشرة لتتحول إلى (معتمد). | "في صفحة المقاهي، ندير المنشآت الشريكة. نرى هنا مقهى 'واحة القهوة' بحالة (معلق / قيد المراجعة). سنقوم الآن باعتماده مباشرة أمامكم... وبمجرد الضغط على الموافقة، تتحدث الحالة فورياً وتُرسل واجهة الـ API إشعار التفعيل للمالك ويصبح المقهى متاحاً للعملاء." | "In the Cafes directory, we oversee all verified coffee houses. Notice 'Oasis Cafe' currently in PENDING review. Watch as we perform a live, one-click approval: the status updates in real-time, the API confirms verification, and the cafe is instantly onboarded into the public mobile index." |
| **4:15 - 5:15** | **تفاصيل المقهى والفروع** (`/cafes/:id`)<br>- الدخول لتفاصيل "مقهى الأندلسية الفاخر".<br>- استعراض ساعات العمل، الفروع (فرع العليا وفرع النخيل)، والموقع الجغرافي. | "بالدخول إلى تفاصيل المقهى، تظهر لنا نظرة شاملة بزاوية 360 درجة: بيانات المالك، ساعات العمل الأسبوعية، والفروع التابعة ومواقعها على الخريطة. المنصة تدعم المقاهي متعددة الفروع بكل سلاسة مع مزامنة بيانات دقيقة." | "Drilling into the cafe profile provides a full 360-degree operational view: owner credentials, weekly operating hours, and multi-branch management. Here we see multiple branches under the same brand, complete with geographic coordinates and individual working hours." |
| **5:15 - 6:15** | **المنتجات، العروض، والفعاليات**<br>- الانتقال إلى صفحة المنتجات (`/products`).<br>- استعراض الأصناف والأسعار وتفعيل التوفر.<br>- استعراض العروض (`/offers`) والفعاليات (`/events`). | "تتيح المنصة للمقاهي إدارة قوائم المنتجات والأسعار؛ فلدينا المشروبات المختصة مثل الفلات وايت والـ V60 مع مفاتيح توفر فورية. أما في قسم العروض، فنشاهد الخصومات النشطة مثل عروض الصباح الباكر وعطلة نهاية الأسبوع، بالإضافة إلى فعاليات المقاهي الثقافية والموسيقية." | "The platform empowers cafes to manage catalogs and engagement. In Products, items like Flat White and V60 are listed with dual Arabic/English names, prices, and instant availability toggles. Next, the Offers and Events modules showcase active discount campaigns and community workshops." |
| **6:15 - 7:30** | **محرك الاشتراكات والمدفوعات** (`/subscriptions`)<br>- استعراض الاشتراكات النشطة والمنتهية.<br>- استعراض باقات الاشتراك (شهري 199 ر.س / سنوي 1999 ر.س).<br>- إبراز تكامل بوابة ميسر (Moyasar). | "نصل إلى المحرك المالي للمنصة: نظام الاشتراكات الشهرية والسنوية لملاك المقاهي وعضويات العملاء المميزين (VIP). يعرض الجدول الاشتراكات النشطة، تواريخ التجديد، والربط التقني المباشر مع بوابة الدفع السعودية (ميسر Moyasar) عبر مدى وApple Pay، مما يضمن أتمتة كاملة للإيرادات." | "Now looking at monetization: the Subscriptions Engine. We offer monthly and annual tiers for cafe partners, as well as VIP customer memberships. The table tracks subscription validity, automatic renewals, and direct integration with Saudi payment gateway Moyasar (Mada & Apple Pay)." |
| **7:30 - 8:30** | **دعم العملاء وإدارة الشكاوى** (`/complaints`)<br>- استعراض قائمة الشكاوى.<br>- فتح شكوى قيد الانتظار واستعراض رد الإدارة ورد المقهى في الشكوى المحلولة. | "الحفاظ على جودة الخدمة أولوية قصوى؛ لذا توفر المنصة نظام شكاوى متكامل. يمكن للإدارة مراجعة ملاحظات العملاء، تحويل الشكوى للمقهى، تسجيل رد المقهى، وتدوين الإجراء التعويضي للعميل مع إشعاره فورياً عبر رسائل النظام." | "Customer satisfaction and quality control are handled via the Complaints Center. Admins can review pending customer issues, forward them to the relevant cafe, capture responses, and close grievances with audit trails and automated user notifications." |
| **8:30 - 9:15** | **الحوكمة وصلاحيات المشرفين** (`/admins`)<br>- استعراض حساب السوبر أدمن والمدير التشغيلي.<br>- استعراض تعيين الصلاحيات بالصفحات (Page-level RBAC). | "لحماية أمن المنصة وحوكمة العمليات، نطبق نظام صلاحيات دقيق (Role-Based Access Control). يمكن للسوبر أدمن تحديد صفحات مخصصة لكل مشرف، مثل إعطاء مسؤول العمليات حق الوصول لإدارة المقاهي والشكاوى فقط دون الوصول للباقات والمدفوعات." | "Platform governance is enforced through granular Role-Based Access Control (RBAC). A Super Admin can selectively assign page-level permissions to operations staff—for example, granting access to Cafes and Complaints while restricting sensitive billing and financial settings." |
| **9:15 - 10:00** | **الخاتمة والجاهزية الفنية**<br>- العودة للوحة التحكم (`/`).<br>- ملخص القيمة المضافة وجاهزية التطبيق. | "ختاماً، تجمع منصة **قهوتي** بين واجهة مستخدم عربية عصرية وسريعة الاستجابة، وخلفية برمجية مبنية بأحدث معايير بايثون وFastAPI لتوفير سرعة فائقة وتوسع مستقبلي جاهز لإطلاق تطبيق الهواتف الذكية. شكراً لمتابعتكم، ونرحب بأي استفسارات!" | "In conclusion, **Kahwety** pairs a modern, intuitive Arabic dashboard with a high-performance FastAPI and PostgreSQL backend, engineered for scale and seamless Flutter mobile integration. Thank you for your time, and we look forward to answering any questions!" |

---

## 🎯 ٤. نصائح ذهبية لتسجيل احترافي (Pro Tips for the Recording)

1. **حركة الماوس الهادئة (Deliberate Cursor Movement):**
   - حرك الماوس بهدوء نحو الزر أو البطاقة المقصودة.
   - توقف لمدة ثانية واحدة فوق العنصر قبل الضغط لإعطاء عين المشاهد فرصة للتركيز.
2. **التعامل مع التحميل اللحظي (Smooth Transitions):**
   - عند الانتقال بين الصفحات، انتظر حتى يكتمل تحميل البيانات (Loading state) قبل التحدث عن الأرقام.
3. **التفاعل الحي (Show, Don't Just Tell):**
   - عند الوصول لصفحة المقاهي، اضغط على زر اعتماد مقهى "واحة القهوة" ليشاهد العميل تحديث الحالة أمام عينه (Live State Transition).
   - افتح نافذة "إرسال إشعار" في لوحة التحكم لإظهار التصميم التفاعلي ثم أغلقها بنعومة.
4. **في حال حدوث خطأ أثناء التسجيل:**
   - لا توقف التسجيل فوراً؛ توقف عن الكلام لثانية واحدة، أعد الجملة من بدايتها، ويمكن إزالة الجزء المكرر خلال دقيقة عبر أي برنامج مونتاج بسيط (أو مشاركته كفيديو متصل طبيعي).
