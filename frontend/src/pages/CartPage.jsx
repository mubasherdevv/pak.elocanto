import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, ShoppingBagIcon, ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../lib/api';

const SHIPPING_THRESHOLD = 50;

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Shipping State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const shipping = totalPrice >= SHIPPING_THRESHOLD ? 0 : 9.99;
  const discount = couponApplied ? totalPrice * 0.1 : 0;
  const grandTotal = totalPrice + shipping - discount;

  const handleApplyCoupon = () => {
    if (coupon.toLowerCase() === 'save10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('Invalid coupon code. Try "SAVE10".');
    }
  };

  const placeOrderHandler = async () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!address || !city || !postalCode || !country) {
       setOrderError('Please fill out all Shipping Address fields.');
       return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderError('');

      await api.post('/orders', {
        orderItems: items.map(item => ({
          ...item,
          qty: item.quantity,
        })),
        shippingAddress: {
          address,
          city,
          postalCode,
          country,
        },
        totalPrice: Number(grandTotal.toFixed(2)),
      });

      clearCart();
      navigate('/orders');
    } catch (error) {
       console.error(error);
       setOrderError(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-light rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBagIcon className="w-12 h-12 text-gray-medium" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-3">Your Cart is Empty</h1>
          <p className="text-gray-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark">Shopping Cart</h1>
          <p className="text-gray-medium text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>
        <Link to="/products" className="flex items-center gap-2 text-sm text-gray-medium hover:text-primary transition-colors">
          <ArrowLeftIcon className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
           {orderError && (
             <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                {orderError}
             </div>
           )}

          {/* Table header — desktop */}
          <div className="hidden md:grid grid-cols-5 gap-4 text-xs font-semibold text-gray-medium uppercase tracking-wide pb-3 border-b border-gray-100">
            <div className="col-span-2">Product</div>
            <div className="text-center">Price</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Subtotal</div>
          </div>

          {/* Items */}
          {items.map(item => {
            const itemPrice = item.price;
            const subtotal = itemPrice * item.quantity;
            
            const discountDisplay = item.originalPrice && item.originalPrice > item.price 
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 0;

            return (
              <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  {/* Product info */}
                  <div className="flex items-center gap-4 md:col-span-2">
                    <Link to={`/products/${item._id}`} className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-gray-100"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/products/${item._id}`}>
                        <h3 className="font-semibold text-dark text-sm leading-tight hover:text-primary transition-colors line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                      </Link>
                      <span className="text-xs text-gray-medium">{item.category}</span>
                      {discountDisplay > 0 && (
                        <span className="ml-2 text-xs font-bold text-primary">-{discountDisplay}%</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="md:text-center">
                    <span className="text-xs text-gray-medium md:hidden mr-2">Price:</span>
                    <span className="font-semibold text-dark">${itemPrice.toFixed(2)}</span>
                    {discountDisplay > 0 && (
                      <span className="ml-1 text-xs text-gray-medium line-through">${item.originalPrice.toFixed(2)}</span>
                    )}
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center md:justify-center">
                    <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="px-3 py-2 text-sm font-bold hover:bg-gray-light transition-colors"
                        disabled={item.quantity <= 1 || isPlacingOrder}
                      >
                        −
                      </button>
                      <span className="px-3 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="px-3 py-2 text-sm font-bold hover:bg-primary hover:text-white transition-colors"
                        disabled={item.quantity >= item.countInStock || isPlacingOrder}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal + remove */}
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <span className="font-bold text-dark">${subtotal.toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-2 text-gray-medium hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      aria-label="Remove item"
                      disabled={isPlacingOrder}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Clear cart */}
          <div className="text-right">
            <button
              onClick={clearCart}
              disabled={isPlacingOrder}
              className="text-sm text-gray-medium hover:text-red-500 transition-colors disabled:opacity-50"
            >
              Clear all items
            </button>
          </div>

          {/* Coupon */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-primary" /> Coupon Code
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                placeholder='Try "SAVE10"'
                className="input-field flex-1"
                disabled={isPlacingOrder}
              />
              <button
                onClick={handleApplyCoupon}
                className="btn-primary whitespace-nowrap"
                disabled={isPlacingOrder}
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-green-600 text-xs mt-2 font-medium">✅ 10% discount applied!</p>
            )}
            {couponError && (
              <p className="text-red-500 text-xs mt-2">{couponError}</p>
            )}
          </div>
        </div>

        {/* Order Summary & Shipping */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Shipping Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
             <h2 className="text-lg font-bold text-dark mb-4">Shipping Address</h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-semibold text-gray-medium mb-1">Mailing Address</label>
                   <input 
                     type="text" 
                     value={address}
                     onChange={(e) => setAddress(e.target.value)}
                     className="input-field w-full text-sm" 
                     placeholder="123 Main St, Apt 4B" 
                     disabled={isPlacingOrder}
                   />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-medium mb-1">City</label>
                   <input 
                     type="text" 
                     value={city}
                     onChange={(e) => setCity(e.target.value)}
                     className="input-field w-full text-sm" 
                     placeholder="New York" 
                     disabled={isPlacingOrder}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium mb-1">Postal Code</label>
                    <input 
                      type="text" 
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="input-field w-full text-sm" 
                      placeholder="10001" 
                      disabled={isPlacingOrder}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium mb-1">Country</label>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="input-field w-full text-sm" 
                      placeholder="United States" 
                      disabled={isPlacingOrder}
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-dark mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-medium">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Coupon Discount (10%)</span>
                  <span className="text-green-600 font-medium">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-medium">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-medium bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  Add <strong>${(SHIPPING_THRESHOLD - totalPrice).toFixed(2)}</strong> more for free shipping
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={placeOrderHandler}
              disabled={isPlacingOrder}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            <Link to="/products" className={`btn-outline w-full text-center block text-sm ${isPlacingOrder ? 'pointer-events-none opacity-50' : ''}`}>
              Continue Shopping
            </Link>

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-medium">
              <span>🔒 Secure Checkout</span>
              <span>💳 All Cards</span>
              <span>🚚 Free Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
