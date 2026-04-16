import api from '../lib/api';

const ProductContext = createContext();

const initialState = {
  products: [],
  product: null,
  loading: true,
  error: null,
};

const productReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_REQUEST':
    case 'FETCH_PRODUCT_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_PRODUCTS_SUCCESS':
      return { ...state, loading: false, products: action.payload };
    case 'FETCH_PRODUCT_SUCCESS':
      return { ...state, loading: false, product: action.payload };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const ProductProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  const fetchProducts = async (keyword = '', category = '') => {
    try {
      dispatch({ type: 'FETCH_PRODUCTS_REQUEST' });
      
      let url = '/products';
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (category) params.append('category', category);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const { data } = await api.get(url);
      
      dispatch({ type: 'FETCH_PRODUCTS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({
        type: 'FETCH_FAIL',
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
    }
  };

  const fetchProductDetails = async (id) => {
    try {
      dispatch({ type: 'FETCH_PRODUCT_REQUEST' });
      
      const { data } = await api.get(`/products/${id}`);
      
      dispatch({ type: 'FETCH_PRODUCT_SUCCESS', payload: data });

    } catch (error) {
      dispatch({
        type: 'FETCH_FAIL',
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
    }
  };

  return (
    <ProductContext.Provider value={{ ...state, fetchProducts, fetchProductDetails }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;
