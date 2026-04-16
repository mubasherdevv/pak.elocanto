import { useState, useEffect } from 'react';
import api from '../lib/api';
import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AdminOrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const deliverHandler = async (id) => {
    if (window.confirm('Are you sure you want to mark this order as delivered?')) {
      try {
        await api.put(`/orders/${id}/deliver`);
        fetchOrders();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-16">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center max-w-lg mx-auto">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-extrabold text-dark">Manage Orders</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-medium">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-dark">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">USER</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TOTAL</th>
                <th className="px-6 py-4">SHIPPING</th>
                <th className="px-6 py-4">DELIVERED</th>
                <th className="px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{order._id.substring(0, 10)}...</td>
                  <td className="px-6 py-4 text-dark font-medium">{order.user && order.user.name}</td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-dark">${order.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs">
                    {order.shippingAddress ? (
                      <div>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No address provided</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {order.isDelivered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircleIcon className="w-4 h-4" />
                        {new Date(order.deliveredAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                        <XCircleIcon className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {!order.isDelivered && (
                       <button 
                         onClick={() => deliverHandler(order._id)}
                         className="btn-primary py-1.5 px-3 text-xs"
                       >
                         Mark Delivered
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
             <div className="text-center py-12 text-gray-medium">
               No orders found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
