export type LanguageCode = 'English' | 'Urdu';

export interface Translations {
  [key: string]: {
    English: string;
    Urdu: string;
    [other: string]: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation Links
  'nav.dashboard': {
    English: 'Dashboard',
    'English (UK)': 'Dashboard',
    Urdu: 'ڈیش بورڈ',
    Arabic: 'لوحة التحكم',
  },
  'nav.pos': {
    English: 'POS Counter',
    'English (UK)': 'POS Counter',
    Urdu: 'پی او ایس کاؤنٹر',
    Arabic: 'نقطة البيع',
  },
  'nav.products': {
    English: 'Products',
    'English (UK)': 'Products',
    Urdu: 'پروڈکٹس',
    Arabic: 'المنتجات',
  },
  'nav.sales': {
    English: 'Sales',
    'English (UK)': 'Sales',
    Urdu: 'سیلز',
    Arabic: 'المبيعات',
  },
  'nav.inventory': {
    English: 'Inventory',
    'English (UK)': 'Inventory',
    Urdu: 'انوینٹری',
    Arabic: 'المخزون',
  },
  'nav.customers': {
    English: 'Customers',
    'English (UK)': 'Customers',
    Urdu: 'گاہک',
    Arabic: 'العملاء',
  },
  'nav.expenses': {
    English: 'Expenses',
    'English (UK)': 'Expenses',
    Urdu: 'اخراجات',
    Arabic: 'المصروفات',
  },
  'nav.analytics': {
    English: 'Analytics',
    'English (UK)': 'Analytics',
    Urdu: 'تجزیات',
    Arabic: 'التحليلات',
  },
  'nav.predictions': {
    English: 'Predictions',
    'English (UK)': 'Predictions',
    Urdu: 'پیش گوئیاں',
    Arabic: 'التوقعات',
  },
  'nav.aiAssistant': {
    English: 'AI Assistant',
    'English (UK)': 'AI Assistant',
    Urdu: 'اے آئی اسسٹنٹ',
    Arabic: 'مساعد الذكاء الاصطناعي',
  },
  'nav.reports': {
    English: 'Reports',
    'English (UK)': 'Reports',
    Urdu: 'رپورٹس',
    Arabic: 'التقارير',
  },
  'nav.settings': {
    English: 'Settings',
    'English (UK)': 'Settings',
    Urdu: 'سیٹنگز',
    Arabic: 'الإعدادات',
  },
  'nav.tagline': {
    English: 'Style Your Business',
    'English (UK)': 'Style Your Business',
    Urdu: 'اپنے کاروبار کو سنواریں',
    Arabic: 'طوّر أعمالك بأناقة',
  },
  'nav.upgradeTitle': {
    English: 'Upgrade to Premium',
    'English (UK)': 'Upgrade to Premium',
    Urdu: 'پریمیم میں اپ گریڈ کریں',
    Arabic: 'الترقية إلى بريميوم',
  },
  'nav.upgradeDesc': {
    English: 'Get advanced AI insights and unlimited products.',
    'English (UK)': 'Get advanced AI insights and unlimited products.',
    Urdu: 'جدید اے آئی بصیرت اور لامحدود مصنوعات حاصل کریں۔',
    Arabic: 'احصل على تحليلات متقدمة ومنتجات غير محدودة.',
  },
  'nav.upgradeBtn': {
    English: 'Upgrade Now',
    'English (UK)': 'Upgrade Now',
    Urdu: 'ابھی اپ گریڈ کریں',
    Arabic: 'ترقية الآن',
  },
  'nav.manageSub': {
    English: 'Manage Subscription',
    'English (UK)': 'Manage Subscription',
    Urdu: 'سبسکرپشن منیج کریں',
    Arabic: 'إدارة الاشتراك',
  },

  // TopBar
  'topbar.searchPlaceholder': {
    English: 'Search anything...',
    'English (UK)': 'Search anything...',
    Urdu: 'کچھ بھی تلاش کریں...',
    Arabic: 'ابحث عن أي شيء...',
  },
  'topbar.businessOwner': {
    English: 'Business Owner',
    'English (UK)': 'Business Owner',
    Urdu: 'کاروبار کے مالک',
    Arabic: 'مالك العمل',
  },
  'topbar.notifications': {
    English: 'Notifications',
    'English (UK)': 'Notifications',
    Urdu: 'اطلاعات',
    Arabic: 'الإشعارات',
  },
  'topbar.markAllRead': {
    English: 'Mark all read',
    'English (UK)': 'Mark all read',
    Urdu: 'سب پڑھ لیں',
    Arabic: 'تعيين الكل كمقروء',
  },
  'topbar.clearAll': {
    English: 'Clear all',
    'English (UK)': 'Clear all',
    Urdu: 'سب صاف کریں',
    Arabic: 'مسح الكل',
  },
  'topbar.noNotifications': {
    English: 'No notifications',
    'English (UK)': 'No notifications',
    Urdu: 'کوئی اطلاع نہیں ہے',
    Arabic: 'لا توجد إشعارات',
  },
  'topbar.profile': {
    English: 'Profile & Settings',
    'English (UK)': 'Profile & Settings',
    Urdu: 'پروفائل اور سیٹنگز',
    Arabic: 'الملف الشخصي والإعدادات',
  },
  'topbar.signOut': {
    English: 'Sign Out',
    'English (UK)': 'Sign Out',
    Urdu: 'لاگ آؤٹ',
    Arabic: 'تسجيل الخروج',
  },
  'topbar.light': {
    English: 'Light',
    'English (UK)': 'Light',
    Urdu: 'روشن',
    Arabic: 'فاتح',
  },
  'topbar.dark': {
    English: 'Dark',
    'English (UK)': 'Dark',
    Urdu: 'تاریک',
    Arabic: 'داكن',
  },

  // Settings Tabs & Content
  'settings.title': {
    English: 'Profile / Settings',
    'English (UK)': 'Profile / Settings',
    Urdu: 'پروفائل / ترتیبات',
    Arabic: 'الملف الشخصي / الإعدادات',
  },
  'settings.subtitle': {
    English: 'Manage your account, business information and app settings.',
    'English (UK)': 'Manage your account, business information and app settings.',
    Urdu: 'اپنے اکاؤنٹ، کاروباری معلومات اور ایپ کی ترتیبات کا نظم کریں۔',
    Arabic: 'إدارة حسابك ومعلومات عملك وإعدادات التطبيق.',
  },
  'settings.tabProfile': {
    English: 'Profile',
    'English (UK)': 'Profile',
    Urdu: 'پروفائل',
    Arabic: 'الملف الشخصي',
  },
  'settings.tabBusiness': {
    English: 'Business Information',
    'English (UK)': 'Business Information',
    Urdu: 'کاروباری معلومات',
    Arabic: 'معلومات العمل',
  },
  'settings.tabAccount': {
    English: 'Account Settings',
    'English (UK)': 'Account Settings',
    Urdu: 'اکاؤنٹ سیٹنگز',
    Arabic: 'إعدادات الحساب',
  },
  'settings.tabNotifications': {
    English: 'Notifications',
    'English (UK)': 'Notifications',
    Urdu: 'اطلاعات',
    Arabic: 'الإشعارات',
  },
  'settings.tabAppearance': {
    English: 'Appearance',
    'English (UK)': 'Appearance',
    Urdu: 'وضع قطع (Appearance)',
    Arabic: 'المظهر',
  },
  'settings.tabLanguage': {
    English: 'Language',
    'English (UK)': 'Language',
    Urdu: 'زبان (Language)',
    Arabic: 'اللغة',
  },

  // Appearance Section
  'settings.appearanceTitle': {
    English: 'Appearance & Theme',
    'English (UK)': 'Appearance & Theme',
    Urdu: 'وضع قطع اور تھیم',
    Arabic: 'المظهر والسمة',
  },
  'settings.appearanceDesc': {
    English: 'Customize the interface visual theme and display density',
    'English (UK)': 'Customise the interface visual theme and display density',
    Urdu: 'انٹرفیس کے تھیم اور ڈسپلے کثافت کو تبدیل کریں۔',
    Arabic: 'تخصيص السمة المرئية للواجهة وكثافة العرض',
  },
  'settings.themeMode': {
    English: 'Theme Mode',
    'English (UK)': 'Theme Mode',
    Urdu: 'تھیم موڈ',
    Arabic: 'وضع السمة',
  },
  'settings.themeLight': {
    English: 'Light',
    'English (UK)': 'Light',
    Urdu: 'روشن (Light)',
    Arabic: 'فاتح',
  },
  'settings.themeLightDesc': {
    English: 'Clean, bright aesthetic',
    'English (UK)': 'Clean, bright aesthetic',
    Urdu: 'صاف ستھرا، روشن منظر',
    Arabic: 'مظهر نظيف ومشرق',
  },
  'settings.themeDark': {
    English: 'Dark',
    'English (UK)': 'Dark',
    Urdu: 'تاریک (Dark)',
    Arabic: 'داكن',
  },
  'settings.themeDarkDesc': {
    English: 'Comfortable in low light',
    'English (UK)': 'Comfortable in low light',
    Urdu: 'کم روشنی میں آرام دہ',
    Arabic: 'مريح في الإضاءة المنخفضة',
  },
  'settings.themeSystem': {
    English: 'System',
    'English (UK)': 'System',
    Urdu: 'سسٹم (System)',
    Arabic: 'النظام',
  },
  'settings.themeSystemDesc': {
    English: 'Sync with OS setting',
    'English (UK)': 'Sync with OS setting',
    Urdu: 'ڈیوائس کی سیٹنگز کے مطابق',
    Arabic: 'مزامنة مع إعدادات النظام',
  },
  'settings.compactLayout': {
    English: 'Compact Table Layout',
    'English (UK)': 'Compact Table Layout',
    Urdu: 'کمپیکٹ ٹیبل لے آؤٹ',
    Arabic: 'تخطيط الجدول المضغوط',
  },
  'settings.compactDesc': {
    English: 'Display more products and transactions per screen view',
    'English (UK)': 'Display more products and transactions per screen view',
    Urdu: 'فی اسکرین مزید پروڈکٹس اور لین دین کی لائنیں دیکھیں',
    Arabic: 'عرض المزيد من المنتجات والمعاملات في كل شاشة',
  },
  'settings.saveAppearance': {
    English: 'Save Appearance',
    'English (UK)': 'Save Appearance',
    Urdu: 'وضع قطع محفوظ کریں',
    Arabic: 'حفظ المظهر',
  },

  // Language Section
  'settings.languageTitle': {
    English: 'Language & Region',
    'English (UK)': 'Language & Region',
    Urdu: 'زبان اور علاقہ',
    Arabic: 'اللغة والمنطقة',
  },
  'settings.languageDesc': {
    English: 'Select the primary language for Threadly assistant',
    'English (UK)': 'Select the primary language for Threadly assistant',
    Urdu: 'تھریڈلی اسسٹنٹ کے لیے اپنی پسندیدہ زبان منتخب کریں۔',
    Arabic: 'حدد اللغة الأساسية لمساعد ثريدلي',
  },
  'settings.saveLanguage': {
    English: 'Save Language',
    'English (UK)': 'Save Language',
    Urdu: 'زبان محفوظ کریں',
    Arabic: 'حفظ اللغة',
  },
  'settings.saving': {
    English: 'Saving...',
    'English (UK)': 'Saving...',
    Urdu: 'محفوظ ہو رہا ہے...',
    Arabic: 'جارٍ الحفظ...',
  },

  // Common UI Actions
  'common.save': {
    English: 'Save',
    'English (UK)': 'Save',
    Urdu: 'محفوظ کریں',
    Arabic: 'حفظ',
  },
  'common.cancel': {
    English: 'Cancel',
    'English (UK)': 'Cancel',
    Urdu: 'منسوخ',
    Arabic: 'إلغاء',
  },
  'common.search': {
    English: 'Search',
    'English (UK)': 'Search',
    Urdu: 'تلاش کریں',
    Arabic: 'بحث',
  },
  'common.delete': {
    English: 'Delete',
    'English (UK)': 'Delete',
    Urdu: 'حذف کریں',
    Arabic: 'حذف',
  },
  'common.edit': {
    English: 'Edit',
    'English (UK)': 'Edit',
    Urdu: 'ترمیم کریں',
    Arabic: 'تعديل',
  },
  'common.all': {
    English: 'All',
    'English (UK)': 'All',
    Urdu: 'تمام',
    Arabic: 'الكل',
  },
  'common.filter': {
    English: 'Filter',
    'English (UK)': 'Filter',
    Urdu: 'فلٹر',
    Arabic: 'تصفية',
  },
  'common.status': {
    English: 'Status',
    'English (UK)': 'Status',
    Urdu: 'حیثیت',
    Arabic: 'الحالة',
  },
  'common.action': {
    English: 'Action',
    'English (UK)': 'Action',
    Urdu: 'عمل',
    Arabic: 'إجراء',
  },
  'common.total': {
    English: 'Total',
    'English (UK)': 'Total',
    Urdu: 'کل',
    Arabic: 'الإجمالي',
  },

  // Dashboard Screen
  'dashboard.title': {
    English: 'Dashboard',
    'English (UK)': 'Dashboard',
    Urdu: 'ڈیش بورڈ',
    Arabic: 'لوحة التحكم',
  },
  'dashboard.todaySales': {
    English: "Today's Sales",
    'English (UK)': "Today's Sales",
    Urdu: 'آج کی سیلز',
    Arabic: 'مبيعات اليوم',
  },
  'dashboard.totalRevenue': {
    English: 'Total Revenue',
    'English (UK)': 'Total Revenue',
    Urdu: 'کل آمدنی',
    Arabic: 'إجمالي الإيرادات',
  },
  'dashboard.totalProducts': {
    English: 'Total Products',
    'English (UK)': 'Total Products',
    Urdu: 'کل پروڈکٹس',
    Arabic: 'إجمالي المنتجات',
  },
  'dashboard.lowStock': {
    English: 'Low Stock',
    'English (UK)': 'Low Stock',
    Urdu: 'کم اسٹاک',
    Arabic: 'مخزون منخفض',
  },
  'dashboard.predictedSales': {
    English: 'Predicted Sales',
    'English (UK)': 'Predicted Sales',
    Urdu: 'متوقع سیلز (AI)',
    Arabic: 'المبيعات المتوقعة',
  },
  'dashboard.salesTrend': {
    English: 'Sales Trend',
    'English (UK)': 'Sales Trend',
    Urdu: 'سیلز کا رجحان',
    Arabic: 'اتجاه المبيعات',
  },
  'dashboard.quickActions': {
    English: 'Quick Actions',
    'English (UK)': 'Quick Actions',
    Urdu: 'فوری کارروائیاں',
    Arabic: 'إجراءات سريعة',
  },
  'dashboard.addProduct': {
    English: 'Add Product',
    'English (UK)': 'Add Product',
    Urdu: 'پروڈکٹ شامل کریں',
    Arabic: 'إضافة منتج',
  },
  'dashboard.newSale': {
    English: 'New Sale',
    'English (UK)': 'New Sale',
    Urdu: 'نئی سیل',
    Arabic: 'عملية بيع جديدة',
  },
  'dashboard.aiAdvisor': {
    English: 'AI Advisor',
    'English (UK)': 'AI Advisor',
    Urdu: 'اے آئی مشیر',
    Arabic: 'مستشار الذكاء الاصطناعي',
  },
  'dashboard.viewReports': {
    English: 'View Reports',
    'English (UK)': 'View Reports',
    Urdu: 'رپورٹس دیکھیں',
    Arabic: 'عرض التقارير',
  },

  // Products & Inventory Catalog
  'products.title': {
    English: 'Products Catalog',
    'English (UK)': 'Products Catalog',
    Urdu: 'پروڈکٹس کیٹلاگ',
    Arabic: 'كتالوج المنتجات',
  },
  'products.subtitle': {
    English: 'Manage your boutique clothing collection, prices & inventory stock',
    'English (UK)': 'Manage your boutique clothing collection, prices & inventory stock',
    Urdu: 'اپنے کپڑوں کی کلیکشن، قیمتیں اور اسٹاک سنبھالیں',
    Arabic: 'إدارة مجموعة الملابس والأسعار والمخزون',
  },
  'products.addProduct': {
    English: 'Add Product',
    'English (UK)': 'Add Product',
    Urdu: 'پروڈکٹ شامل کریں',
    Arabic: 'إضافة منتج',
  },
  'products.inStock': {
    English: 'In Stock',
    'English (UK)': 'In Stock',
    Urdu: 'اسٹاک موجود ہے',
    Arabic: 'متوفر بالمخزون',
  },
  'products.lowStock': {
    English: 'Low Stock',
    'English (UK)': 'Low Stock',
    Urdu: 'کم اسٹاک',
    Arabic: 'مخزون قليل',
  },
  'products.outOfStock': {
    English: 'Out of Stock',
    'English (UK)': 'Out of Stock',
    Urdu: 'اسٹاک ختم',
    Arabic: 'نفد من المخزون',
  },
  'products.price': {
    English: 'Price',
    'English (UK)': 'Price',
    Urdu: 'قیمت',
    Arabic: 'السعر',
  },
  'products.sizes': {
    English: 'Sizes',
    'English (UK)': 'Sizes',
    Urdu: 'سائز',
    Arabic: 'المقاسات',
  },
  'inventory.adjustStock': {
    English: 'Adjust Stock Quantity',
    'English (UK)': 'Adjust Stock Quantity',
    Urdu: 'اسٹاک کی مقدار تبدیل کریں',
    Arabic: 'تعديل كمية المخزون',
  },
  'inventory.updateStock': {
    English: 'Update Stock',
    'English (UK)': 'Update Stock',
    Urdu: 'اسٹاک اپ ڈیٹ کریں',
    Arabic: 'تحديث المخزون',
  },
  'inventory.currentStock': {
    English: 'Current Stock',
    'English (UK)': 'Current Stock',
    Urdu: 'موجودہ اسٹاک',
    Arabic: 'المخزون الحالي',
  },

  // Sales
  'sales.title': {
    English: 'Sales History',
    'English (UK)': 'Sales History',
    Urdu: 'سیلز کا ریکارڈ',
    Arabic: 'سجل المبيعات',
  },
  'sales.walkIn': {
    English: 'Walk-in Customer',
    'English (UK)': 'Walk-in Customer',
    Urdu: 'عام گاہک (Walk-in)',
    Arabic: 'عميل نقدي',
  },
};

