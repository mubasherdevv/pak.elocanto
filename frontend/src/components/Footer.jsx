import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { cache } from '../utils/cache';

export default function Footer() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState(() => cache.get('categories')?.slice(0, 6) || []);
  const [cities, setCities] = useState(() => cache.get('cities')?.slice(0, 6) || []);

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const [catRes, cityRes] = await Promise.all([
          api.get('/categories'),
          api.get('/cities')
        ]);
        setCategories(catRes.data.slice(0, 6));
        setCities(cityRes.data.slice(0, 6));
      } catch (err) {
        console.error('Footer data load error:', err);
      }
    };
    loadFooterData();
  }, []);

  const socialLinks = settings?.socialLinks || {};
  const appLinks = settings?.appLinks || {};

  return (
    <footer className="bg-[#0f172a] text-white pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link to="/" className="inline-block transform transition-hover hover:opacity-80">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings?.siteName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl px-4 py-1.5 font-black text-xl italic shadow-lg shadow-orange-500/20">
                  {settings?.siteName || 'Elocanto'}
                </div>
              )}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings?.defaultMetaDescription || "Pakistan's most trusted classified marketplace. Buy, sell, and find everything from cars and property to jobs and services."}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.facebook && (
                <a href="https://www.facebook.com/elocanto.pk" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-orange-500 hover:text-white transition-all text-gray-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" /></svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a href="https://www.instagram.com/elocanto.pk" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-orange-500 hover:text-white transition-all text-gray-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.197-4.354-2.612-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              )}
              {socialLinks.whatsapp && (
                <a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-orange-500 hover:text-white transition-all text-gray-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
              )}
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Popular Categories</h4>
            <ul className="space-y-4">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    to={`/${cat.slug}`}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">→</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Cities */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Top Cities</h4>
            <ul className="space-y-4">
              {cities.map((city) => (
                <li key={city._id}>
                  <Link
                    to={`/cities/${city.slug}`}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">→</span>
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Contact Us</h4>
            <ul className="space-y-4">

              <li className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-orange-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <a href={`tel:${settings?.phone || '+923001234567'}`} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  {settings?.phone || '+92 300 123 4567'}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-orange-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <a href={`mailto:${settings?.adminEmail || 'support@elocanto.pk'}`} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  {settings?.adminEmail || 'support@elocanto.pk'}
                </a>
              </li>
            </ul>
          </div>

          {/* Download & Links */}
          <div>




          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-gray-500 text-xs font-medium italic">
            © {new Date().getFullYear()} <span className="text-orange-500 font-black tracking-tight">{settings?.siteName || 'Elocanto'}</span> – Pakistan's #1 Classifieds Platform.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Secure Trusted Site
            </span>
            <Link to="/contact" className="text-orange-500 text-[10px] uppercase font-black hover:underline tracking-widest">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

