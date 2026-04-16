import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function SubcategoryAdsPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAds();
  }, [id, token]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/subcategories/${id}/ads`);
      setAds(data);
    } catch (err) {
      console.error('Error fetching subcategory ads:', err);
      setError('Failed to load ads for this subcategory.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/categories')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Subcategory Ads</h1>
        </div>
        <div className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
          {ads.length} Ads Found
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Details</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seller</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ads.map((ad) => (
              <tr key={ad._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                      {ad.images?.[0] ? (
                        <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <PhotoIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{ad.title}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Ref: {ad._id.substring(ad._id.length - 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ad.isFeatured ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}>
                    {ad.isFeatured ? '★ Featured' : 'Simple'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-gray-900">₹{ad.price.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ad.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {ad.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{ad.seller?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-gray-400 font-medium italic">{ad.seller?.email}</span>
                    <span className="text-[10px] text-orange-500 font-black mt-0.5">{ad.seller?.phone || 'No Phone'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ads.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 font-bold italic">No ads published in this subcategory yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
