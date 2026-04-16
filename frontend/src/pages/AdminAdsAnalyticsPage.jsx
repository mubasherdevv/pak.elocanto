import React from 'react';
import AdminAnalytics from '../components/AdminAnalytics';

export default function AdminAdsAnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ads & Engagement Analytics</h1>
        <p className="text-gray-500 text-sm mt-2">Monitor ad performance, views, impressions, and customer engagement metrics.</p>
      </div>
      
      <AdminAnalytics />
    </div>
  );
}
