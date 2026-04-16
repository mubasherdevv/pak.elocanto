import { Link } from 'react-router-dom';
import { MapPinIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { generateAdSlug } from '../utils/urlUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const formatPrice = (price) => {
  if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `PKR ${(price / 100000).toFixed(1)} Lac`;
  return `PKR ${price.toLocaleString()}`;
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
};

export default function HorizontalAdCard({ ad }) {
  const image = getOptimizedImageUrl(ad.images?.[0], 400);

  const adSlug = generateAdSlug(ad);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', '@media (min-width: 640px)': { flexDirection: 'row' },
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: 16, overflow: 'hidden', padding: 16, gap: 20, marginBottom: 16,
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }} className="sm:flex-row flex-col flex card">

      {/* Image Section */}
      <Link to={`/ads/${adSlug}`} style={{ flexShrink: 0, position: 'relative', width: 200, height: 180, borderRadius: 12, overflow: 'hidden' }}>
        <img
          src={image} alt={ad.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </Link>

      {/* Content Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: 'var(--gray-50)', padding: '4px 10px', borderRadius: 8, width: 'fit-content' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900 }}>
                {ad.seller?.name?.substring(0, 1).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: 10, fontStyle: 'normal', fontWeight: 900, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{ad.seller?.name || 'Seller'}</span>
            </div>
            <Link to={`/ads/${adSlug}`} style={{ textDecoration: 'none' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.3, marginBottom: 8 }}>
                {ad.title}
              </h3>
            </Link>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
              {formatPrice(ad.price)}
            </div>
            {ad.isNegotiable && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Negotiable</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, color: 'var(--gray-700)', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPinIcon style={{ width: 14 }} /> {ad.city}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon style={{ width: 14 }} /> {timeAgo(ad.createdAt)}</span>
          {ad.category?.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 12px', borderRadius: 999, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', overflow: 'hidden' }}>
                <img src={ad.category.image || 'https://via.placeholder.com/20'} alt={ad.category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>{ad.category.name}</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: '#334155', fontWeight: 600, lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ad.description || 'Verified property listing on Elocanto marketplace with high-quality services.'}
        </p>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={`https://wa.me/${ad.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', color: 'white', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            <ChatBubbleLeftEllipsisIcon style={{ width: 16 }} /> WhatsApp
          </a>
          <a href={`tel:${ad.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e3a8a', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            <PhoneIcon style={{ width: 16 }} /> Call
          </a>
          <Link to={`/ads/${adSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8fafc', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
