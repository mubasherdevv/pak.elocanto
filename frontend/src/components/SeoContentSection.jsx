import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SeoContentSection() {
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSeo = async () => {
      let pageType = 'home';
      let slug = '';

      const path = location.pathname;
      const parts = path.split('/').filter(Boolean);

      // 1. Handle Homepage
      if (parts.length === 0) {
        pageType = 'home';
      } 
      // 2. Handle Ad Detail: /ads/:slug
      else if (parts[0] === 'ads' && parts[1]) {
        pageType = 'ad_detail';
        slug = parts[1];
      }
      // 3. Handle Cities & Locations: /cities/:citySlug/...
      else if (parts[0] === 'cities' && parts[1]) {
        const citySlug = parts[1];
        const type = parts[2];
        const subSlug = parts[3];

        if (type === 'areas' && subSlug) {
          pageType = 'area';
          slug = subSlug;
        } else if (type === 'hotels' && subSlug) {
          pageType = 'hotel';
          slug = subSlug;
        } else {
          pageType = 'city';
          slug = citySlug;
        }
      }
      // 4. Handle Auth & Static Pages
      else if (['login', 'register', 'profile', 'ads'].includes(parts[0])) {
        pageType = parts[0];
        if (pageType === 'ads') {
            const params = new URLSearchParams(location.search);
            const cat = params.get('category');
            const sub = params.get('subcategory');
            if (sub) { pageType = 'subcategory'; slug = sub; }
            else if (cat) { pageType = 'category'; slug = cat; }
            else pageType = 'home';
        }
      }
      // 5. Handle Categories & Subcategories (/:cat/:sub)
      else if (parts.length === 1) {
        pageType = 'category';
        slug = parts[0];
      }
      else if (parts.length >= 2) {
        pageType = 'subcategory';
        slug = parts[1];
      }

      try {
        const { data } = await api.get('/seo/match', { params: { pageType, slug } });
        setContent(data);
      } catch (err) {
        console.error('SEO Content load error:', err);
      }
    };
    fetchSeo();
  }, [location.pathname, location.search]);

  if (!content || !content.description) return null;

  return (
    <div className="container-custom" style={{ marginTop: 40, marginBottom: 20 }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 12, color: 'var(--dark)' }}>{content.title}</h2>
        
        <div 
          className="wysiwyg-content"
          style={{ 
            maxHeight: expanded ? 'none' : '100px', 
            overflow: 'hidden', 
            position: 'relative',
            fontSize: 14,
            color: '#4b5563',
            lineHeight: 1.6
          }}
          dangerouslySetInnerHTML={{ __html: content.description }}
        />

        <button 
          onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 12, color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      </div>
    </div>
  );
}
