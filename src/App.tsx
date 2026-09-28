import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Car as CarIcon,
  CheckCircle2,
  Gauge,
  Images,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCircle2,
  WifiOff,
  X,
} from 'lucide-react';
import type { Car } from './types';
import { carService, describeFirestoreError } from './lib/carService';
import { useAuth } from './lib/authContext';
import { SAMPLE_CARS } from './data';
import { waLink } from './lib/phone';
import AuthModal from './components/AuthModal';
import CarForm from './components/CarForm';
import MyPage from './components/MyPage';

const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}car-placeholder.svg`;
const CITIES = ['الكل', 'طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'زليتن', 'البيضاء', 'سبها', 'درنة', 'طبرق', 'غريان'];

export default function App() {
  const { firebaseUser, profile, loading: authLoading } = useAuth();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [view, setView] = useState<'home' | 'me'>(() =>
    window.location.hash.startsWith('#/me') ? 'me' : 'home',
  );
  const [showAuth, setShowAuth] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const go = useCallback((next: 'home' | 'me') => {
    window.location.hash = next === 'me' ? '#/me' : '';
    setView(next);
  }, []);

  useEffect(() => {
    const onHash = () => setView(window.location.hash.startsWith('#/me') ? 'me' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const loadCars = useCallback(async () => {
    setLoading(true);
    try {
      const { cars: remoteCars, online } = await carService.getAllCars();
      if (online && remoteCars.length > 0) {
        setCars(remoteCars);
        setNotice(null);
      } else if (online) {
        setCars(SAMPLE_CARS);
        setNotice('لا توجد إعلانات منشورة بعد. الإعلانات المعروضة حالياً توضيحية للعرض فقط.');
      } else {
        setCars(SAMPLE_CARS);
        setNotice(
          'تعذّر الاتصال بقاعدة البيانات، والإعلانات المعروضة توضيحية فقط. لن يُنشر أي إعلان جديد حتى يعود الاتصال.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  const myCars = firebaseUser ? cars.filter((car) => car.ownerId === firebaseUser.uid) : [];

  const filteredCars = cars.filter((car) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      car.make.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q) ||
      car.description.toLowerCase().includes(q) ||
      car.city.includes(searchQuery.trim());
    const matchesCity = selectedCity === 'الكل' || car.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const openAddForm = () => {
    if (!firebaseUser) {
      notify('سجّل الدخول أولاً لتتمكن من نشر إعلانك.', 'error');
      setShowAuth(true);
      return;
    }
    setEditingCar(null);
    setShowForm(true);
  };

  const openEditForm = (car: Car) => {
    setEditingCar(car);
    setShowForm(true);
  };

  const handleDelete = async (car: Car) => {
    if (!window.confirm(`حذف إعلان «${car.make} ${car.model}» نهائياً؟`)) return;
    try {
      await carService.deleteCar(car.id);
      setCars((prev) => prev.filter((item) => item.id !== car.id));
      notify('تم حذف الإعلان.');
    } catch (err) {
      notify(describeFirestoreError(err), 'error');
    }
  };

  const accountLabel = profile?.displayName ?? 'حسابي';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border max-w-[92vw] ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-500/40'
              : 'bg-rose-900 text-rose-100 border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <button onClick={() => go('home')} className="flex items-center gap-2 sm:gap-3 min-w-0 text-right">
            <span className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <CarIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>
            <span className="min-w-0">
              <span className="block text-base sm:text-2xl font-black tracking-tight whitespace-nowrap">سوق سيارات ليبيا</span>
              <span className="block text-[10px] sm:text-xs font-semibold text-blue-600">cars.com.ly</span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-blue-600/25 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sm:hidden">أضف سيارة</span>
              <span className="hidden sm:inline">أضف سيارتك مجاناً</span>
            </button>

            {firebaseUser ? (
              <button
                onClick={() => go('me')}
                className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700"
                title="صفحتي الشخصية"
              >
                {profile?.avatarImage ? (
                  <img src={profile.avatarImage} alt="" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                    {profile?.avatarEmoji || '🚗'}
                  </span>
                )}
                <span className="hidden sm:inline">{accountLabel}</span>
                {myCars.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full">{myCars.length}</span>}
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                disabled={authLoading}
                className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>دخول</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {notice && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] sm:text-sm font-bold px-4 py-2.5 flex flex-wrap items-center justify-center gap-2 text-center">
          <WifiOff className="w-4 h-4" />
          <span>{notice}</span>
          <button onClick={() => void loadCars()} className="underline hover:no-underline">إعادة المحاولة</button>
        </div>
      )}

      {view === 'me' ? (
        <MyPage onBack={() => go('home')} onEdit={openEditForm} onToast={notify} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
          <section className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-4 py-1.5 rounded-full text-blue-700 text-[11px] sm:text-xs font-black">
              <Sparkles className="w-4 h-4" />
              <span>صوّر سيارتك بكاميرا هاتفك وانشرها في دقيقة</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              ابحث عن سيارتك القادمة <span className="text-blue-600">بكل سهولة</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              تصفح عروض السيارات في طرابلس، بنغازي، مصراتة وكافة المدن، وتواصل مباشرة مع صاحب السيارة عبر الواتساب.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالنوع أو الموديل أو المدينة..."
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm text-sm"
                />
              </div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-700 shadow-sm"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city === 'الكل' ? 'كل المدن' : city}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                السيارات المعروضة
                <span className="text-xs sm:text-sm font-normal text-slate-500">({filteredCars.length} سيارة)</span>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </h3>
              {myCars.length > 0 && (
                <button onClick={() => go('me')} className="text-xs font-bold text-blue-600 hover:underline">
                  إعلاناتي ({myCars.length})
                </button>
              )}
            </div>

            {loading && cars.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                    <div className="aspect-[16/10] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-9 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 space-y-3">
                <CarIcon className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">لا توجد سيارات مطابقة لبحثك حالياً.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCity('الكل'); }}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isOwner={Boolean(firebaseUser && car.ownerId === firebaseUser.uid)}
                    onEdit={() => openEditForm(car)}
                    onDelete={() => void handleDelete(car)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="mt-16 border-t border-slate-200 py-8 text-center text-[11px] sm:text-xs text-slate-500 font-semibold space-y-1">
        <p>© {new Date().getFullYear()} سوق سيارات ليبيا (cars.com.ly) — جميع الحقوق محفوظة</p>
        <p className="text-slate-400">تطبيق ويب موجّه للهاتف: صوّر سيارتك من الكاميرا وانشرها فوراً، وتابع إعلاناتك من صفحتك الشخصية.</p>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => notify('تم تسجيل الدخول بنجاح.')} />
      <CarForm
        isOpen={showForm}
        editing={editingCar}
        onClose={() => setShowForm(false)}
        onSaved={(message) => { notify(message); void loadCars(); }}
        onRequireAuth={() => { setShowForm(false); setShowAuth(true); }}
      />
    </div>
  );
}

function CarCard({
  car,
  isOwner,
  onEdit,
  onDelete,
}: {
  car: Car;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const gallery = car.images && car.images.length > 0 ? car.images : car.image ? [car.image] : [];
  const [active, setActive] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  // المصغّرة الخفيفة تُعرض في القائمة (تصفح سريع)، والصورة الكاملة عند فتح المعرض
  const image = active === 0 && car.thumb ? car.thumb : gallery[active] ?? PLACEHOLDER_IMAGE;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />
        <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-400" />
          {car.city}
        </span>
        {gallery.length > 1 && (
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-3 left-3 bg-slate-900/75 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
          >
            <Images className="w-3 h-3" />
            {gallery.length} صور
          </button>
        )}
        {isOwner && (
          <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">إعلاني</span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-black">{car.make} {car.model}</h4>
            <span className="text-base font-black text-blue-600 whitespace-nowrap">
              {car.price.toLocaleString()} <span className="text-[11px]">د.ل</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
              <Calendar className="w-3 h-3 text-slate-400" /> {car.year}
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
              <Gauge className="w-3 h-3 text-slate-400" /> {car.mileage}
            </span>
            {car.ownerName && <span className="text-slate-400">• {car.ownerName}</span>}
          </div>
          <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">{car.description}</p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <a
            href={waLink(car.whatsapp, `السلام عليكم، مهتم بسيارة ${car.make} ${car.model} موديل ${car.year} المعروضة في cars.com.ly بسعر ${car.price.toLocaleString()} د.ل`)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            واتساب
          </a>
          {isOwner && (
            <>
              <button onClick={onEdit} className="border border-slate-300 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700" title="تعديل">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={onDelete} className="border border-rose-200 text-rose-700 hover:bg-rose-50 p-2.5 rounded-xl" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {showGallery && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="bg-white rounded-2xl p-3 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm">{car.make} {car.model}</p>
              <button onClick={() => setShowGallery(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={gallery[active] ?? PLACEHOLDER_IMAGE} alt="" className="w-full max-h-[60vh] object-contain bg-slate-100 rounded-xl" />
            <div className="flex gap-2 mt-3 overflow-x-auto custom-scroll">
              {gallery.map((src, index) => (
                <button key={index} onClick={() => setActive(index)} className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 ${index === active ? 'border-blue-600' : 'border-transparent'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
