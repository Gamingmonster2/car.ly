import type { Car } from './types';

/** مسار صورة محلية داخل مجلد public (يعمل على أي مجلد فرعي بفضل BASE_URL) */
const img = (file: string): string => `${import.meta.env.BASE_URL}images/cars/${file}`;

/**
 * بيانات توضيحية (تجريبية) تظهر فقط عندما تكون قاعدة البيانات فارغة أو غير متصلة،
 * حتى لا يرى الزائر صفحة فارغة. هذه الإعلانات ليست حقيقية ولا تُنشر لأي أحد،
 * ورقم الواتساب فيها هو رقم إدارة الموقع للتوضيح.
 *
 * الصور ملفات محلية داخل public/images/cars (صور مجانية من Unsplash تحت رخصة Unsplash)
 * ووُصفت كل سيارة بما يطابق صورتها فعلاً.
 */
export const SAMPLE_CARS: Car[] = [
  {
    id: 'sample-1',
    make: 'Toyota',
    model: 'Camry XLE',
    year: 2022,
    price: 85000,
    mileage: '24,000 كم',
    image: img('sample-1.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'طرابلس',
    description:
      'كامري 2022 وارد أمريكي، محرك 2.5 فل أوبشن، فتحة سقف، شاشة أبل كاربلاي، رادار ومحدد مسار، بحالة الوكالة.',
    createdAt: Date.now() - 1000 * 60 * 45,
    views: 48,
    ownerName: 'إعلان توضيحي',
  },
  {
    id: 'sample-2',
    make: 'Chevrolet',
    model: 'Camaro',
    year: 2019,
    price: 165000,
    mileage: '52,000 كم',
    image: img('sample-2.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'بنغازي',
    description:
      'كمارو وارد أمريكي، محرك V6، جنوط أصلية، طلاء كامل بلا صدمات، فحص كمبيوتر نظيف وجاهزة للتحويل.',
    createdAt: Date.now() - 1000 * 60 * 120,
    views: 73,
    ownerName: 'إعلان توضيحي',
  },
  {
    id: 'sample-3',
    make: 'Ford',
    model: 'Expedition',
    year: 2020,
    price: 195000,
    mileage: '61,000 كم',
    image: img('sample-3.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'مصراتة',
    description:
      'فورد إكسبدشن عائلي واسع، دفع رباعي، 7 مقاعد جلد، شاشة خلفية، مكيف ممتاز مناسب للسفر والطرق الطويلة.',
    createdAt: Date.now() - 1000 * 60 * 240,
    views: 92,
    ownerName: 'إعلان توضيحي',
  },
  {
    id: 'sample-4',
    make: 'Mercedes-Benz',
    model: 'AMG',
    year: 2019,
    price: 245000,
    mileage: '65,000 كم',
    image: img('sample-4.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'طرابلس',
    description:
      'مرسيدس AMG، طلاء وكالة بالكامل، إضاءة داخلية ملونة، نظام صوت ممتاز، صيانة دورية منتظمة وموثقة.',
    createdAt: Date.now() - 1000 * 60 * 360,
    views: 135,
    ownerName: 'إعلان توضيحي',
  },
  {
    id: 'sample-5',
    make: 'BMW',
    model: '420i كوبيه',
    year: 2019,
    price: 155000,
    mileage: '48,000 كم',
    image: img('sample-5.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'الزاوية',
    description:
      'بي إم دبليو 420i كوبيه، محرك تيربو اقتصادي، كراسي جلد، شاشة أصلية، حالة ممتازة وجاهزة للاستخدام اليومي.',
    createdAt: Date.now() - 1000 * 60 * 600,
    views: 110,
    ownerName: 'إعلان توضيحي',
  },
  {
    id: 'sample-6',
    make: 'Nissan',
    model: 'GT-R',
    year: 2017,
    price: 320000,
    mileage: '39,000 كم',
    image: img('sample-6.jpg'),
    whatsapp: '218931792006',
    phone: '0931792006',
    city: 'بنغازي',
    description:
      'نيسان GT-R، دفع رباعي، محرك توين تيربو، صيانة كاملة، حالة نادرة لمحبي السيارات الرياضية.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    views: 184,
    ownerName: 'إعلان توضيحي',
  },
];
