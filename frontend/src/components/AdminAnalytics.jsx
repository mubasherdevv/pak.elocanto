import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EyeIcon, ChatBubbleLeftIcon, PresentationChartLineIcon, UsersIcon } from '@heroicons/react/24/outline';

const AdminAnalytics = () => {
  const [adsData, setAdsData] = useState({
    summary: {
      totalViews: 0,
      totalImpressions: 0,
      totalInquiries: 0,
      totalUsers: 0,
      engagementRate: '0%'
    },
    trendData: [],
    topAds: [],
    viewsByCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        try {
          const { data: analyticsData } = await api.get('/admin/ads-analytics');
          setAdsData(analyticsData || {
            summary: {
              totalViews: 0,
              totalImpressions: 0,
              totalInquiries: 0,
              totalUsers: 0,
              engagementRate: '0%'
            },
            trendData: [],
            topAds: [],
            viewsByCategory: []
          });
        } catch (err) {
          console.error('Error fetching ads analytics:', err);
          setAdsData({
            summary: {
              totalViews: 0,
              totalImpressions: 0,
              totalInquiries: 0,
              totalUsers: 0,
              engagementRate: '0%'
            },
            trendData: [],
            topAds: [],
            viewsByCategory: []
          });
        }
      } catch (err) {
        console.error('Error in fetchAnalytics:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center mb-8">
        Failed to load analytics: {error}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-lg text-sm">
          <p className="font-bold text-dark mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold text-xs">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-10">
      {/* Ads Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-dark mb-4">Ads Performance & Engagement</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-medium">7-Day Views</p>
              <EyeIcon className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-dark">
              {(adsData?.summary?.totalViews || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-medium mt-2">Unique ad detail page clicks</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-medium">Lifetime Views</p>
              <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                <EyeIcon className="w-4 h-4 text-blue-700" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-dark">
              {(adsData?.summary?.totalLifetimeViews || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-medium mt-2">All-time total ad views</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-medium">7-Day Impressions</p>
              <PresentationChartLineIcon className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-dark">
              {(adsData?.summary?.totalImpressions || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-medium mt-2">Listing page visibility</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-medium">Total Registered Users</p>
              <UsersIcon className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-dark">
              {(adsData?.summary?.totalUsers || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-medium mt-2">Lifetime users count</p>
          </div>
        </div>

        {/* Views & Inquiries Trend Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-medium uppercase tracking-wider mb-6">7-Day Activity Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={adsData?.trendData || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Impressions"
                />
                <Line
                  type="monotone"
                  dataKey="inquiries"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Inquiries"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two Column Layout for Top Ads and Category Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Viewed Ads */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-medium uppercase tracking-wider mb-4">Top 5 Most Viewed Ads</h3>
            <div className="space-y-3">
              {(adsData?.topAds && adsData.topAds.length > 0) ? (
                adsData.topAds.map((ad, index) => (
                  <div key={ad._id} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                        <p className="text-sm font-semibold text-dark truncate">{ad.title}</p>
                        {ad.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Featured</span>}
                      </div>
                      <p className="text-sm text-gray-medium">Price: ${(ad?.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{ad.viewCount}</p>
                      <p className="text-xs text-dark font-medium">views</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-medium text-center py-4">No views yet</p>
              )}
            </div>
          </div>

          {/* Views by Category */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-medium uppercase tracking-wider mb-4">Views by Category</h3>
            <div className="space-y-3">
              {(adsData?.viewsByCategory && adsData.viewsByCategory.length > 0) ? (
                adsData.viewsByCategory.map((cat) => (
                  <div key={cat._id} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dark">{cat._id}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-gradient-to-r from-primary to-blue-400 rounded-full" style={{ width: `${Math.min((cat.count / Math.max(...adsData.viewsByCategory.map(c => c.count))) * 100, 100)}px` }}></div>
                      <span className="text-sm font-bold text-dark w-10 text-right">{cat.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-dark text-center py-4">No category data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
