import { useState, useMemo, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FunnelIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/ProductCard';
import ProductContext from '../context/ProductContext';

const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Sports'];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const ratingOptions = [4, 3, 2, 1];

export default function ProductListingPage() {
  const { products, loading, error, fetchProducts } = useContext(ProductContext);
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showDiscount, setShowDiscount] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category === selectedCategory);
    }
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (showDiscount) list = list.filter(p => p.originalPrice > p.price);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [products, selectedCategory, priceRange, minRating, sortBy, showDiscount, searchQuery]);

  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide">Categories</h3>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat}>
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-medium hover:text-dark hover:bg-gray-light'
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-gray-medium">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide">Minimum Rating</h3>
        <div className="space-y-2">
          <button
            onClick={() => setMinRating(0)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${minRating === 0 ? 'bg-primary text-white font-semibold' : 'text-gray-medium hover:text-dark hover:bg-gray-light'}`}
          >
            All Ratings
          </button>
          {ratingOptions.map(r => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${minRating === r ? 'bg-primary text-white font-semibold' : 'text-gray-medium hover:text-dark hover:bg-gray-light'}`}
            >
              {'⭐'.repeat(r)} & up
            </button>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showDiscount}
            onChange={e => setShowDiscount(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-dark font-medium">On Sale Only</span>
        </label>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => { setSelectedCategory('All'); setPriceRange([0, 500]); setMinRating(0); setShowDiscount(false); }}
        className="w-full py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-all"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-medium mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-dark font-medium">Products</span>
        {selectedCategory !== 'All' && (
          <>
            <span className="mx-2">/</span>
            <span className="text-dark font-medium">{selectedCategory}</span>
          </>
        )}
      </nav>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-dark flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-primary" /> Filters
              </h2>
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-dark">
                {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === 'All' ? 'All Products' : selectedCategory}
              </h1>
              <p className="text-sm text-gray-medium mt-0.5">{filtered.length} products found</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter btn */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" /> Filters
              </button>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white cursor-pointer"
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading / Error handling */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
             <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center">{error}</div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4 text-gray-300">🔍</div>
              <h3 className="text-xl font-semibold text-dark mb-2">No products found</h3>
              <p className="text-gray-medium">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-dark text-lg">Filters</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 hover:text-primary transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
