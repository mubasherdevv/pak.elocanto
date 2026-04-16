import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const RecentOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const { data } = await api.get('/orders/recent');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentOrders();
  }, [token]);

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
        Failed to load recent orders: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
         <h3 className="text-lg font-bold text-dark">Recent Orders</h3>
         <a href="/admin/orders" className="text-sm font-semibold text-primary hover:text-indigo-700 transition-colors">View All</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-medium">
          <thead className="bg-white text-xs uppercase font-semibold text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">USER</th>
              <th className="px-6 py-4">DATE</th>
              <th className="px-6 py-4">TOTAL</th>
              <th className="px-6 py-4">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{order._id.substring(0, 10)}...</td>
                <td className="px-6 py-4 text-dark font-medium">{order.user && order.user.name}</td>
                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-dark">${order.totalPrice.toFixed(2)}</td>
                <td className="px-6 py-4">
                  {order.isDelivered ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircleIcon className="w-4 h-4" />
                      Delivered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                      <XCircleIcon className="w-4 h-4" />
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
           <div className="text-center py-8 text-gray-medium">
             No recent orders found.
           </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrdersList;
