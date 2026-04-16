import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CheckCircleIcon, XCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyOrders();
    }
  }, [user]);

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
      <h1 className="text-2xl font-extrabold text-dark mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No orders found</h2>
          <p className="text-gray-medium mb-6">Looks like you haven't placed any orders yet.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-medium font-medium mb-1">Order Placed</p>
                  <p className="text-dark font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-medium font-medium mb-1">Total</p>
                  <p className="text-dark font-semibold">${order.totalPrice.toFixed(2)}</p>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <p className="text-gray-medium font-medium mb-1">Order ID</p>
                  <p className="text-dark font-mono text-xs break-all">{order._id}</p>
                </div>
                <div className="col-span-2 lg:col-span-1 lg:text-right">
                  <p className="text-gray-medium font-medium mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${order.isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.isDelivered ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    {order.isDelivered ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}` : 'Processing'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 border-b border-gray-100 p-4 md:p-6 text-sm">
                <p className="text-gray-medium font-medium mb-1">Shipping To:</p>
                {order.shippingAddress ? (
                  <p className="text-dark font-medium">
                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No address provided</p>
                )}
              </div>
              
              <div className="p-4 md:p-6">
                <div className="divide-y divide-gray-100">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                      <Link to={`/products/${item.product?._id || item.product}`}>
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product?._id || item.product}`} className="font-semibold text-dark hover:text-primary transition-colors text-sm md:text-base line-clamp-1">
                          {item.name}
                        </Link>
                        <p className="text-gray-medium text-sm mt-0.5">Qty: {item.qty}</p>
                      </div>
                      <div className="font-bold text-dark whitespace-nowrap">
                        ${(item.price * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
