import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  StarIcon, HeartIcon, ShoppingCartIcon, TruckIcon,
  ShieldCheckIcon, ArrowLeftIcon, ShareIcon, CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProductContext from '../context/ProductContext';

const extraImages = [
  '/placeholder.png',
  '/placeholder.png',
  '/placeholder.png',
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { product, products, loading, error, fetchProductDetails, fetchProducts } = useContext(ProductContext);

  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProductDetails(id);
    if (products.length === 0) {
      fetchProducts();
    }
    // Reset quantity and image on product change
    setQuantity(1);
    setSelectedImage(0);
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  if (loading || !product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="bg-red-50 text-red-500 p-6 rounded-xl inline-block">
          <h2 className="text-xl font-bold mb-2">Error Loading Product</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/products')} className="mt-4 btn-primary">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const discountedPrice = product.originalPrice && product.originalPrice > product.price
    ? product.price.toFixed(2)
    : product.price.toFixed(2);
    
  // Calculate discount percentage if original price exists
  const discountDisplay = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = products.filter(p => p.category === product.category && p._id !== product._id).slice(0, 4);
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating || 0));

  const thumbnails = [product.image, ...extraImages];

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-medium mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-dark font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 text-sm text-gray-medium hover:text-primary transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Products
      </button>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-light">
            <img
              src={thumbnails[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails */}
          <div className="flex gap-3">
            {thumbnails.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                  selectedImage === i ? 'border-primary shadow-md scale-105' : 'border-gray-light hover:border-gray-medium'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Category */}
          <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{product.category}</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-dark mb-3 leading-tight">{product.name}</h1>

          {/* Rating & reviews */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex">
              {stars.map((filled, i) => (
                filled
                  ? <StarSolid key={i} className="w-4 h-4 text-yellow-400" />
                  : <StarIcon key={i} className="w-4 h-4 text-gray-300" />
              ))}
            </div>
            <span className="text-sm text-gray-medium">({product.numReviews || 0} reviews)</span>
            
            {product.countInStock > 0 ? (
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1 ml-2 border-l pl-3">
                <CheckIcon className="w-4 h-4" /> In Stock ({product.countInStock})
              </span>
            ) : (
               <span className="text-sm font-semibold text-red-500 ml-2 border-l pl-3">
                Out of Stock
              </span>
            )}
            
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-extrabold text-primary">${discountedPrice}</span>
            {discountDisplay > 0 && (
              <>
                <span className="text-lg text-gray-medium line-through">${product.originalPrice.toFixed(2)}</span>
                <span className="badge bg-primary text-white">{discountDisplay}% OFF</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-medium text-sm leading-relaxed mb-6 border-b border-gray-100 pb-6">
            {product.description}
          </p>

          {/* Color selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-dark mb-3 block">
                Color: <span className="text-primary">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg text-sm border-2 transition-all duration-200 ${
                      selectedColor === color
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-gray-200 text-gray-medium hover:border-gray-medium hover:text-dark'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to cart */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Quantity stepper */}
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-3 text-lg font-bold hover:bg-gray-light transition-colors"
                disabled={product.countInStock === 0}
              >
                −
              </button>
              <span className="px-5 py-3 text-base font-semibold min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(product.countInStock, q + 1))}
                className="px-4 py-3 text-lg font-bold hover:bg-primary hover:text-white transition-colors"
                disabled={product.countInStock === 0 || quantity >= product.countInStock}
              >
                +
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                product.countInStock === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : added
                    ? 'bg-green-500 text-white scale-105'
                    : 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              {product.countInStock === 0 ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setWished(!wished)}
              className={`p-3.5 rounded-xl border-2 transition-all duration-200 ${
                wished ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-medium hover:border-primary hover:text-primary'
              }`}
              aria-label="Add to wishlist"
            >
              <HeartIcon className={`w-5 h-5 ${wished ? 'fill-primary' : ''}`} />
            </button>

            <button
              className="p-3.5 rounded-xl border-2 border-gray-200 text-gray-medium hover:border-primary hover:text-primary transition-all duration-200"
              aria-label="Share"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery info */}
          <div className="space-y-3 bg-gray-light rounded-2xl p-5">
            <div className="flex items-center gap-3 text-sm">
              <TruckIcon className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-dark">Free Delivery</span>
                <span className="text-gray-medium"> — Estimated 3-5 business days</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-dark">30-Day Return</span>
                <span className="text-gray-medium"> — Free & easy returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-10 bg-primary rounded-sm" />
            <h2 className="text-xl font-bold text-dark">Related Products</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
