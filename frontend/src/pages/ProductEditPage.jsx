import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setName(data.name);
        setPrice(data.price);
        setImage(data.image);
        setBrand(data.brand);
        setCategory(data.category);
        setCountInStock(data.countInStock);
        setDescription(data.description);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      await api.put(
        `/products/${id}`,
        { name, price, image, brand, category, countInStock, description }
      );
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="container-custom py-10 max-w-3xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-gray-medium hover:text-primary transition-colors mb-6 font-medium">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-dark mb-8">Edit Product</h1>

        {loading ? (
           <div className="flex justify-center py-10">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
           </div>
        ) : error ? (
           <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center">{error}</div>
        ) : (
          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-dark mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1">Price ($)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1">Count In Stock</label>
                <input type="number" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} className="input-field w-full" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1">Image URL</label>
              <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="input-field w-full" required />
              {image && <img src={image} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded shadow-sm border border-gray-100" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-1">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-1">Category</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-1">Description</label>
              <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field w-full" required></textarea>
            </div>

            <button type="submit" className="btn-primary w-full flex justify-center py-3 mt-4" disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Product'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
