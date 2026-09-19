"""
Comprehensive Demo Data Seeder for Kahwety (Cafe Platform)
Populates realistic Arabic and English records across all platform modules:
- Users (Super Admin, Permissioned Admin, Cafe Owners, Customers with stats)
- Admin Page Permissions
- Cafes (Approved with coordinates & branches, Pending for live approval demo)
- Suggested Cafes (New, In-progress, Handled)
- Products (Food & Beverage items with prices)
- Offers & Discounts
- Events
- Complaints (Pending & Resolved with admin/cafe responses)
- Subscription Plans & Subscriptions (Active, Expired)
- Payments (Paid revenue records for live dashboard metrics)
- Notifications (Broadcasts to All, Cafe Owners, and Customers)

Usage:
    python scripts/seed_demo_data.py
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# Ensure project root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import bcrypt
from sqlalchemy import select

from app.core.database import async_session_maker
from app.modules.users.models import User
from app.modules.admins.models import UserPagePermission
from app.modules.customers.models import CustomerStatistics
from app.modules.cafes.models import Cafe
from app.modules.branches.models import Branch
from app.modules.products.models import Product
from app.modules.offers.models import Offer
from app.modules.events.models import Event
from app.modules.complaints.models import Complaint
from app.modules.suggested_cafes.models import SuggestedCafe
from app.modules.subscription_plans.models import SubscriptionPlan
from app.modules.subscriptions.models import Subscription
from app.modules.payments.models import Payment
from app.modules.notifications.models import Notification
from app.common.enums import (
    UserRole,
    UserStatus,
    CafeRegistrationStatus,
    OfferStatus,
    EventStatus,
    ComplaintStatus,
    SuggestedCafeStatus,
    SubscriberType,
    BillingCycle,
    SubscriptionStatus,
    PaymentStatus,
    NotificationTargetType,
    PagePermission,
)


def hash_pw(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


async def seed_demo_data():
    print("🌱 Starting Kahwety Demo Data Seeder...")
    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    default_password_hash = hash_pw("Admin123!")

    async with async_session_maker() as session:
        # -------------------------------------------------------------
        # 1. Super Admin & Operations Admin
        # -------------------------------------------------------------
        print("  -> Seeding Admin users...")
        
        # Super Admin
        super_admin = await session.scalar(select(User).where(User.email == "admin@cafe.com"))
        if not super_admin:
            super_admin = User(
                id=str(uuid.uuid4()),
                email="admin@cafe.com",
                phone="+966500000001",
                full_name="عبدالرحمن الغامدي (سوبر أدمن)",
                password_hash=default_password_hash,
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE,
                email_verified=True,
                phone_verified=True,
            )
            session.add(super_admin)
            await session.flush()
            print("     ✓ Super Admin created: admin@cafe.com / Admin123!")
        else:
            print("     - Super Admin already exists: admin@cafe.com")

        # Operations Admin (with granular permissions)
        ops_admin = await session.scalar(select(User).where(User.email == "ops@cafe.com"))
        if not ops_admin:
            ops_admin = User(
                id=str(uuid.uuid4()),
                email="ops@cafe.com",
                phone="+966500000002",
                full_name="سارة المنصور (مدير عمليات)",
                password_hash=default_password_hash,
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                email_verified=True,
                phone_verified=True,
            )
            session.add(ops_admin)
            await session.flush()

            # Assign permissions to ops_admin
            allowed_pages = [
                PagePermission.DASHBOARD,
                PagePermission.CAFES,
                PagePermission.PRODUCTS,
                PagePermission.OFFERS,
                PagePermission.COMPLAINTS,
                PagePermission.SUGGESTED_CAFES,
            ]
            for page in allowed_pages:
                perm = UserPagePermission(
                    id=str(uuid.uuid4()),
                    user_id=ops_admin.id,
                    page=page.value,
                )
                session.add(perm)
            print("     ✓ Operations Admin created with page permissions: ops@cafe.com / Admin123!")
        else:
            print("     - Operations Admin already exists: ops@cafe.com")

        # -------------------------------------------------------------
        # 2. Cafe Owners
        # -------------------------------------------------------------
        print("  -> Seeding Cafe Owners...")
        owners_data = [
            ("faisal@andalusia.sa", "+966501234567", "فيصل السعيد (مالك مقهى الأندلسية)"),
            ("nasser@specialty.sa", "+966551234567", "ناصر الحربي (مالك ركن القهوة المختصة)"),
            ("mona@palmcafe.sa", "+966561234567", "منى القحطاني (مالكة مقهى واحة القهوة)"),
            ("tariq@sea.sa", "+966571234567", "طارق الزهراني (مالك مقهى نسيم البحر)"),
        ]

        owners = {}
        for email, phone, name in owners_data:
            owner = await session.scalar(select(User).where(User.email == email))
            if not owner:
                owner = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    phone=phone,
                    full_name=name,
                    password_hash=default_password_hash,
                    role=UserRole.CAFE_OWNER,
                    status=UserStatus.ACTIVE,
                    email_verified=True,
                    phone_verified=True,
                )
                session.add(owner)
                await session.flush()
                print(f"     ✓ Owner created: {email}")
            owners[email] = owner

        # -------------------------------------------------------------
        # 3. Customers & Customer Statistics
        # -------------------------------------------------------------
        print("  -> Seeding Customers...")
        customers_data = [
            ("ahmed@gmail.com", "+966509876541", "أحمد الشمري", 16, 15, 1, Decimal("485.50")),
            ("reem@gmail.com", "+966559876542", "ريم العتيبي", 32, 31, 1, Decimal("1120.00")),
            ("khalid@gmail.com", "+966549876543", "خالد الدوسري", 9, 9, 0, Decimal("295.00")),
            ("noura@gmail.com", "+966539876544", "نورة التميمي", 21, 20, 1, Decimal("740.00")),
        ]

        customers = {}
        for email, phone, name, tot_orders, comp_orders, can_orders, spent in customers_data:
            cust = await session.scalar(select(User).where(User.email == email))
            if not cust:
                cust = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    phone=phone,
                    full_name=name,
                    password_hash=default_password_hash,
                    role=UserRole.CUSTOMER,
                    status=UserStatus.ACTIVE,
                    email_verified=True,
                    phone_verified=True,
                )
                session.add(cust)
                await session.flush()

                # Customer statistics
                stats = CustomerStatistics(
                    id=str(uuid.uuid4()),
                    user_id=cust.id,
                    total_orders=tot_orders,
                    completed_orders=comp_orders,
                    cancelled_orders=can_orders,
                    total_spent=spent,
                )
                session.add(stats)
                print(f"     ✓ Customer created with statistics: {email}")
            customers[email] = cust

        # -------------------------------------------------------------
        # 4. Cafes & Branches
        # -------------------------------------------------------------
        print("  -> Seeding Cafes & Branches...")
        
        # Cafe 1: Approved, Riyadh
        cafe1 = await session.scalar(select(Cafe).where(Cafe.name == "مقهى الأندلسية الفاخر"))
        if not cafe1:
            cafe1 = Cafe(
                id=str(uuid.uuid4()),
                owner_id=owners["faisal@andalusia.sa"].id,
                approved_by=super_admin.id,
                name="مقهى الأندلسية الفاخر",
                description="تجربة قهوة مختصة أصيلة وأجواء عمل هادئة متميزة في قلب العاصمة الرياض",
                address="شارع التحلية، حي العليا، الرياض",
                latitude=24.7011,
                longitude=46.6834,
                place_id="ChIJN1t_tDeuEmsRUsoyG83frY4",
                registration_status=CafeRegistrationStatus.APPROVED,
                registration_date=now - timedelta(days=90),
                working_hours={"weekdays": "06:30 - 00:00", "weekends": "08:00 - 01:30"},
                is_active=True,
            )
            session.add(cafe1)
            await session.flush()

            # Branches
            b1 = Branch(
                id=str(uuid.uuid4()),
                cafe_id=cafe1.id,
                name="فرع العليا (الرئيسي)",
                address="شارع التحلية، حي العليا، الرياض",
                latitude=24.7011,
                longitude=46.6834,
                working_hours={"daily": "06:30 - 00:00"},
            )
            b2 = Branch(
                id=str(uuid.uuid4()),
                cafe_id=cafe1.id,
                name="فرع النخيل",
                address="طريق الملك فهد، حي النخيل، الرياض",
                latitude=24.7450,
                longitude=46.6350,
                working_hours={"daily": "07:00 - 01:00"},
            )
            session.add_all([b1, b2])
            print("     ✓ Cafe 1 seeded: مقهى الأندلسية الفاخر (الرياض)")

        # Cafe 2: Approved, Jeddah
        cafe2 = await session.scalar(select(Cafe).where(Cafe.name == "ركن القهوة المختصة - Specialty Corner"))
        if not cafe2:
            cafe2 = Cafe(
                id=str(uuid.uuid4()),
                owner_id=owners["nasser@specialty.sa"].id,
                approved_by=super_admin.id,
                name="ركن القهوة المختصة - Specialty Corner",
                description="محامص حصرية ومشروبات باردة منعشة على كورنيش جدة الساحلي",
                address="طريق الكورنيش، حي الشاطئ، جدة",
                latitude=21.5892,
                longitude=39.1098,
                place_id="ChIJR9Zk2uYwvRUR7Jz01-lJHQ8",
                registration_status=CafeRegistrationStatus.APPROVED,
                registration_date=now - timedelta(days=60),
                working_hours={"weekdays": "07:00 - 01:00", "weekends": "07:00 - 02:00"},
                is_active=True,
            )
            session.add(cafe2)
            await session.flush()

            b3 = Branch(
                id=str(uuid.uuid4()),
                cafe_id=cafe2.id,
                name="فرع الشاطئ",
                address="طريق الكورنيش، حي الشاطئ، جدة",
                latitude=21.5892,
                longitude=39.1098,
                working_hours={"daily": "07:00 - 01:30"},
            )
            b4 = Branch(
                id=str(uuid.uuid4()),
                cafe_id=cafe2.id,
                name="فرع الروضة",
                address="شارع التحلية، حي الروضة، جدة",
                latitude=21.5540,
                longitude=39.1580,
                working_hours={"daily": "08:00 - 00:00"},
            )
            session.add_all([b3, b4])
            print("     ✓ Cafe 2 seeded: ركن القهوة المختصة (جدة)")

        # Cafe 3: Approved, Khobar (Eastern Province)
        cafe3 = await session.scalar(select(Cafe).where(Cafe.name == "مقهى نسيم البحر"))
        if not cafe3:
            cafe3 = Cafe(
                id=str(uuid.uuid4()),
                owner_id=owners["tariq@sea.sa"].id,
                approved_by=super_admin.id,
                name="مقهى نسيم البحر",
                description="إطلالة ساحرة وقهوة مقطرة طازجة بجلسات خارجية مريحة",
                address="كورنيش الخبر الجنوبي، حي الحمراء، الخبر",
                latitude=26.2818,
                longitude=50.2185,
                registration_status=CafeRegistrationStatus.APPROVED,
                registration_date=now - timedelta(days=40),
                working_hours={"daily": "08:00 - 01:00"},
                is_active=True,
            )
            session.add(cafe3)
            await session.flush()
            print("     ✓ Cafe 3 seeded: مقهى نسيم البحر (الخبر)")

        # Cafe 4: PENDING - Perfect for live demonstration of one-click approval during the video!
        cafe4 = await session.scalar(select(Cafe).where(Cafe.name == "مقهى واحة القهوة"))
        if not cafe4:
            cafe4 = Cafe(
                id=str(uuid.uuid4()),
                owner_id=owners["mona@palmcafe.sa"].id,
                approved_by=None,
                name="مقهى واحة القهوة",
                description="مقهى ومحمصة سحابية متخصصة في البن الإثيوبي والكولومبي الفاخر",
                address="حي الملقا، طريق أنس بن مالك، الرياض",
                latitude=24.8115,
                longitude=46.6214,
                registration_status=CafeRegistrationStatus.PENDING,
                registration_date=now - timedelta(days=2),
                working_hours={"daily": "07:00 - 23:00"},
                is_active=True,
            )
            session.add(cafe4)
            await session.flush()
            print("     ✓ Cafe 4 seeded (PENDING for live approval demo): مقهى واحة القهوة (الرياض)")

        # -------------------------------------------------------------
        # 5. Suggested Cafes
        # -------------------------------------------------------------
        print("  -> Seeding Suggested Cafes...")
        suggested_data = [
            ("عبدالله التميمي", "الرياض", "+966512345678", "https://maps.google.com/?q=Riyadh", SuggestedCafeStatus.NEW, "موقع استراتيجي ممتاز بالقرب من جامعة الملك سعود ونسبة إقبال شبابية عالية"),
            ("سلطان الخالدي", "الدمام", "+966523456789", "https://maps.google.com/?q=Dammam", SuggestedCafeStatus.SENT, "تم إرسال فريق التحقق الميداني والاتصال الأولي بصاحب المنشأة"),
            ("ياسر البقمي", "مكة", "+966534567890", "https://maps.google.com/?q=Makkah", SuggestedCafeStatus.APPROVED, "تمت المعاينة بنجاح واعتماد الطلب ودعوة المالك للتسجيل الرسمي"),
            ("فهد العسيري", "المدينة", "+966543219876", "https://maps.google.com/?q=Madinah", SuggestedCafeStatus.NEW, "مقهى تراثي يقدم قهوة سعودية مميزة في المنطقة المركزية"),
        ]

        for owner_n, city, ph, g_link, st, notes in suggested_data:
            existing_sug = await session.scalar(select(SuggestedCafe).where(SuggestedCafe.owner_name == owner_n))
            if not existing_sug:
                sug = SuggestedCafe(
                    id=str(uuid.uuid4()),
                    owner_name=owner_n,
                    city=city,
                    phone=ph,
                    google_link=g_link,
                    status=st,
                    admin_notes=notes,
                    website="https://kahwety.com/partner",
                    instagram=f"@{owner_n.replace(' ', '_')}_cafe",
                )
                session.add(sug)
        print("     ✓ Suggested cafes seeded (NEW, SENT, APPROVED across Saudi cities)")

        # -------------------------------------------------------------
        # 6. Products (Food & Beverage)
        # -------------------------------------------------------------
        print("  -> Seeding Products...")
        if cafe1:
            products_c1 = [
                ("فلات وايت", "Flat White", "إسبريسو مزدوج مع حليب مبخر بقوام مخملي حريري", Decimal("18.00"), True),
                ("كورتادو", "Cortado", "توازن مثالي بين تركيز الإسبريسو ودفء الحليب المبخر", Decimal("16.00"), True),
                ("V60 كولومبيا سوبريمو", "V60 Colombia Supremo", "تقطير يدوي مختص بإيحاءات الفواكه المجففة والشوكولاتة الداكنة", Decimal("22.00"), True),
                ("كيكة الزعفران الملكية", "Saffron Royal Cake", "كيكة إسفنجية هشة مشربة بصوص الزعفران والهيل الطبيعي", Decimal("26.00"), True),
                ("كوكيز الشوكولاتة البلجيكية", "Belgian Choc Cookie", "مخبوز مقرمش من الأطراف وطري محشو بقطع الشوكولاتة البلجيكية", Decimal("14.00"), True),
            ]
            for name, name_en, desc, price, avail in products_c1:
                p = await session.scalar(select(Product).where(Product.cafe_id == cafe1.id, Product.name == name))
                if not p:
                    p = Product(
                        id=str(uuid.uuid4()),
                        cafe_id=cafe1.id,
                        name=name,
                        name_en=name_en,
                        description=desc,
                        price=price,
                        availability=avail,
                    )
                    session.add(p)

        if cafe2:
            products_c2 = [
                ("آيس سبانش لاتيه", "Iced Spanish Latte", "المشروب الأكثر طلباً بنكهة الحليب المكثف المحلى وإسبريسو طازج", Decimal("24.00"), True),
                ("سولتيد كراميل كولد برو", "Salted Caramel Cold Brew", "منقوع القهوة الباردة لمدة 18 ساعة مع رغوة الكراميل المملح", Decimal("25.00"), True),
                ("كرواسون اللوز الفرنسي", "Almond Croissant", "كرواسون فرنسي مخبوز طازج ومحشو بكريمة اللوز المحمص", Decimal("19.00"), True),
                ("ماتشا لاتيه عضوي", "Organic Matcha Latte", "شاي ماتشا ياباني أصيل مع حليب الشوفان الفاخر", Decimal("26.00"), True),
            ]
            for name, name_en, desc, price, avail in products_c2:
                p = await session.scalar(select(Product).where(Product.cafe_id == cafe2.id, Product.name == name))
                if not p:
                    p = Product(
                        id=str(uuid.uuid4()),
                        cafe_id=cafe2.id,
                        name=name,
                        name_en=name_en,
                        description=desc,
                        price=price,
                        availability=avail,
                    )
                    session.add(p)
        print("     ✓ Products seeded with prices and descriptions")

        # -------------------------------------------------------------
        # 7. Offers & Promotions
        # -------------------------------------------------------------
        print("  -> Seeding Offers...")
        if cafe1:
            o1 = await session.scalar(select(Offer).where(Offer.cafe_id == cafe1.id))
            if not o1:
                o1 = Offer(
                    id=str(uuid.uuid4()),
                    cafe_id=cafe1.id,
                    title="خصم الصباح الباكر 25%",
                    description="ابدأ يومك بنشاط! خصم 25% على كافة مشروبات القهوة الساخنة من الساعة 7 إلى 10 صباحاً",
                    discount_percentage=25,
                    start_date=now - timedelta(days=5),
                    end_date=now + timedelta(days=25),
                    status=OfferStatus.ACTIVE,
                )
                session.add(o1)

        if cafe2:
            o2 = await session.scalar(select(Offer).where(Offer.cafe_id == cafe2.id))
            if not o2:
                o2 = Offer(
                    id=str(uuid.uuid4()),
                    cafe_id=cafe2.id,
                    title="عرض عطلة نهاية الأسبوع 20%",
                    description="استمتع بأجواء الكورنيش مع خصم 20% على المشروبات الباردة والحلويات كل جمعة وسبت",
                    discount_percentage=20,
                    start_date=now - timedelta(days=2),
                    end_date=now + timedelta(days=12),
                    status=OfferStatus.ACTIVE,
                )
                session.add(o2)
        print("     ✓ Promotional offers seeded")

        # -------------------------------------------------------------
        # 8. Events
        # -------------------------------------------------------------
        print("  -> Seeding Events...")
        if cafe1:
            ev1 = await session.scalar(select(Event).where(Event.cafe_id == cafe1.id))
            if not ev1:
                ev1 = Event(
                    id=str(uuid.uuid4()),
                    cafe_id=cafe1.id,
                    title="أمسية العود والقهوة المختصة",
                    description="عزف عود حي وأجواء طربية راقية مع تجربة تذوق مجانية لمحاصيل القهوة الفاخرة",
                    location="فرع العليا، الرياض",
                    event_date=now + timedelta(days=7),
                    status=EventStatus.PUBLISHED,
                )
                session.add(ev1)

        if cafe2:
            ev2 = await session.scalar(select(Event).where(Event.cafe_id == cafe2.id))
            if not ev2:
                ev2 = Event(
                    id=str(uuid.uuid4()),
                    cafe_id=cafe2.id,
                    title="ورشة عمل: فن الرسم على اللاتيه (Latte Art)",
                    description="جلسة تدريبية تفاعلية مع خبير تحضير القهوة لتعلم أساسيات التبخير ورسم القلوب والورود",
                    location="فرع الشاطئ، جدة",
                    event_date=now + timedelta(days=14),
                    status=EventStatus.PUBLISHED,
                )
                session.add(ev2)
        print("     ✓ Events seeded (Published upcoming events)")

        # -------------------------------------------------------------
        # 9. Complaints Lifecycle
        # -------------------------------------------------------------
        print("  -> Seeding Complaints...")
        cust_ahmed = customers.get("ahmed@gmail.com")
        cust_khalid = customers.get("khalid@gmail.com")

        if cust_ahmed and cafe1:
            c1 = await session.scalar(select(Complaint).where(Complaint.customer_id == cust_ahmed.id))
            if not c1:
                c1 = Complaint(
                    id=str(uuid.uuid4()),
                    customer_id=cust_ahmed.id,
                    cafe_id=cafe1.id,
                    subject="تأخر في تسليم الطلب بالفرع",
                    description="انتظرت أكثر من 25 دقيقة لاستلام مشروب الفلات وايت بالرغم من قلة الزوار داخل الفرع في الفترة الصباحية.",
                    status=ComplaintStatus.PENDING,
                    admin_response=None,
                    cafe_response=None,
                )
                session.add(c1)

        if cust_khalid and cafe2:
            c2 = await session.scalar(select(Complaint).where(Complaint.customer_id == cust_khalid.id))
            if not c2:
                c2 = Complaint(
                    id=str(uuid.uuid4()),
                    customer_id=cust_khalid.id,
                    cafe_id=cafe2.id,
                    subject="استفسار حول تطبيق كود الخصم الأسبوعي",
                    description="لم يتم احتساب نسبة الخصم 20% عند الدفع الإلكتروني عبر الكاشير في الفرع يوم الجمعة.",
                    status=ComplaintStatus.RESOLVED,
                    admin_response="تم التواصل مع إدارة المقهى وإيداع قيمة الخصم كرصيد تعويضي في محفظة العميل.",
                    cafe_response="نعتذر عن الإشكال الفني في نقطة البيع، تم تحديث النظام وتعويض العميل الكريم.",
                )
                session.add(c2)
        print("     ✓ Complaints seeded (Pending review & Resolved)")

        # -------------------------------------------------------------
        # 10. Subscription Plans & Subscriptions & Revenue Payments
        # -------------------------------------------------------------
        print("  -> Seeding Subscription Plans & Subscriptions...")
        plans_data = [
            ("الباقة الأساسية للمقاهي - شهري", "إدارة مقهى واحد مع فرعين وعرض غير محدود للمنتجات والعروض الترويجية", SubscriberType.CAFE_OWNER, BillingCycle.MONTHLY, Decimal("199.00"), 30),
            ("الباقة الذهبية للمقاهي - سنوي", "إدارة غير محدودة للفروع مع لوحة تحليلات متقدمة ودعم فني مخصص على مدار الساعة", SubscriberType.CAFE_OWNER, BillingCycle.ANNUAL, Decimal("1999.00"), 365),
            ("عضوية عشاق القهوة (VIP) - شهري", "خصومات حصرية 15% وتوصيل مجاني في كافة المقاهي الشريكة المشتركة", SubscriberType.CUSTOMER, BillingCycle.MONTHLY, Decimal("49.00"), 30),
        ]

        plans = {}
        for name, desc, sub_type, cycle, price, days in plans_data:
            plan = await session.scalar(select(SubscriptionPlan).where(SubscriptionPlan.name == name))
            if not plan:
                plan = SubscriptionPlan(
                    id=str(uuid.uuid4()),
                    name=name,
                    description=desc,
                    subscriber_type=sub_type,
                    billing_cycle=cycle,
                    price=price,
                    currency="SAR",
                    duration_days=days,
                    is_active=True,
                )
                session.add(plan)
                await session.flush()
                print(f"     ✓ Plan created: {name} ({price} SAR)")
            plans[name] = plan

        # Active Subscriptions & Paid Payments
        p_cafe_monthly = plans.get("الباقة الأساسية للمقاهي - شهري")
        p_cafe_annual = plans.get("الباقة الذهبية للمقاهي - سنوي")
        p_cust_vip = plans.get("عضوية عشاق القهوة (VIP) - شهري")

        owner_faisal = owners.get("faisal@andalusia.sa")
        owner_nasser = owners.get("nasser@specialty.sa")
        cust_reem = customers.get("reem@gmail.com")

        if owner_faisal and p_cafe_monthly:
            sub1 = await session.scalar(select(Subscription).where(Subscription.user_id == owner_faisal.id))
            if not sub1:
                sub1 = Subscription(
                    id=str(uuid.uuid4()),
                    user_id=owner_faisal.id,
                    plan_id=p_cafe_monthly.id,
                    status=SubscriptionStatus.ACTIVE,
                    starts_at=two_weeks_ago,
                    expires_at=now + timedelta(days=16),
                )
                session.add(sub1)
                await session.flush()

                pay1 = Payment(
                    id=str(uuid.uuid4()),
                    user_id=owner_faisal.id,
                    subscription_id=sub1.id,
                    moyasar_payment_id="pay_demo_moya_001_live",
                    amount=p_cafe_monthly.price,
                    currency="SAR",
                    status=PaymentStatus.PAID,
                    payment_method="CreditCard (Mada)",
                )
                session.add(pay1)

        if owner_nasser and p_cafe_annual:
            sub2 = await session.scalar(select(Subscription).where(Subscription.user_id == owner_nasser.id))
            if not sub2:
                sub2 = Subscription(
                    id=str(uuid.uuid4()),
                    user_id=owner_nasser.id,
                    plan_id=p_cafe_annual.id,
                    status=SubscriptionStatus.ACTIVE,
                    starts_at=now - timedelta(days=30),
                    expires_at=now + timedelta(days=335),
                )
                session.add(sub2)
                await session.flush()

                pay2 = Payment(
                    id=str(uuid.uuid4()),
                    user_id=owner_nasser.id,
                    subscription_id=sub2.id,
                    moyasar_payment_id="pay_demo_moya_002_live",
                    amount=p_cafe_annual.price,
                    currency="SAR",
                    status=PaymentStatus.PAID,
                    payment_method="Apple Pay",
                )
                session.add(pay2)

        if cust_reem and p_cust_vip:
            sub3 = await session.scalar(select(Subscription).where(Subscription.user_id == cust_reem.id))
            if not sub3:
                sub3 = Subscription(
                    id=str(uuid.uuid4()),
                    user_id=cust_reem.id,
                    plan_id=p_cust_vip.id,
                    status=SubscriptionStatus.ACTIVE,
                    starts_at=one_week_ago,
                    expires_at=now + timedelta(days=23),
                )
                session.add(sub3)
                await session.flush()

                pay3 = Payment(
                    id=str(uuid.uuid4()),
                    user_id=cust_reem.id,
                    subscription_id=sub3.id,
                    moyasar_payment_id="pay_demo_moya_003_live",
                    amount=p_cust_vip.price,
                    currency="SAR",
                    status=PaymentStatus.PAID,
                    payment_method="Mada",
                )
                session.add(pay3)
        print("     ✓ Subscriptions and verified revenue payments recorded (Moyasar)")

        # -------------------------------------------------------------
        # 11. Notifications Broadcasts
        # -------------------------------------------------------------
        print("  -> Seeding System Notifications...")
        notifs_data = [
            ("مرحباً بكم في منصة قهوتي ☕", "يسعدنا انضمام نخبة من المقاهي الشريكة الجديدة هذا الشهر! ترقبوا مميزات لوحة التحكم والتحديثات القادمة.", NotificationTargetType.ALL),
            ("تحديث سياسة العروض الموسمية", "نرجو من جميع شركائنا ملاك المقاهي مراجعة قائمة العروض الرمضانية وتحديث تواريخ الصلاحية والأسعار التنافسية.", NotificationTargetType.CAFE_OWNER),
            ("مفاجأة عطلة نهاية الأسبوع 🎉", "اكتشف أقرب المقاهي المختصة حولك واستمتع بخصومات حصرية تصل حتى 30%! تصفح تطبيق قهوتي الآن.", NotificationTargetType.CUSTOMER),
        ]

        for title, msg, target in notifs_data:
            existing_n = await session.scalar(select(Notification).where(Notification.title == title))
            if not existing_n:
                n = Notification(
                    id=str(uuid.uuid4()),
                    title=title,
                    message=msg,
                    target_type=target,
                    created_by=super_admin.id,
                )
                session.add(n)
        print("     ✓ System notification broadcasts seeded")

        # Commit all changes
        await session.commit()
        print("\n✨ SUCCESS: All demo data successfully seeded into the database!")
        print("=================================================================")
        print("🔑 Super Admin Login:  admin@cafe.com / Admin123!")
        print("🔑 Operations Admin:   ops@cafe.com   / Admin123!")
        print("=================================================================\n")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
