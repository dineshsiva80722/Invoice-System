import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader, RefreshCw } from 'lucide-react';
import { databaseService } from '../../services/database';
import ProductForm from './ProductForm';
import { Product } from '../../types';

// Create a type that ensures description is always a string
type SafeProduct = Omit<Product, 'description'> & {
  description: string;
};

export default function ProductList() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SafeProduct | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await databaseService.getProducts();
      // Ensure all products have required fields with defaults
      const safeProducts = (productsData || []).map(product => ({
        ...product,
        description: product.description || '',
        name: product.name || 'Unnamed Product',
        rate: product.rate || 0,
        unit: product.unit || 'each',
        category: product.category || 'uncategorized',
        isService: product.isService || false,
        taxRate: product.taxRate || 0
      })) as SafeProduct[];
      setProducts(safeProducts);
      console.log(`📋 Loaded ${safeProducts.length} products`);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product/service? This action cannot be undone.')) {
      try {
        const success = await databaseService.deleteProduct(productId);
        if (success) {
          // Refresh the list to get updated data
          await loadProducts();
          console.log('✅ Product deleted successfully');
        } else {
          throw new Error('Delete operation failed');
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleSaveProduct = async (productData: Partial<SafeProduct>) => {
    try {
      const savedProduct = await databaseService.saveProduct(productData);
      
      // Ensure products is an array before trying to use array methods
      const currentProducts = Array.isArray(products) ? products : [];
      
      if (editingProduct) {
        // Update existing product
        setProducts(currentProducts.map(product => 
          product.id === editingProduct.id ? savedProduct : product
        ));
        console.log('✅ Product updated successfully');
      } else {
        // Add new product
        setProducts([savedProduct, ...currentProducts]);
        console.log('✅ Product created successfully');
      }
      
      setShowProductForm(false);
      setEditingProduct(undefined);
    } catch (error) {
      console.error('Failed to save product:', error);
      // Extract the error message if it's an Error object
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save product: ${errorMessage}`);
    }
  };

  const categories = products && Array.isArray(products)
    ? ['all', ...Array.from(new Set(products.map(p => p.category)))]
    : ['all'];

  const filteredProducts = products && Array.isArray(products)
    ? products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <button
          onClick={() => setShowProductForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Rate
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {product.category}
                  </td>
                  <td className="py-4 px-6">
                    {product.description || '-'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">${product.rate.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">/ {product.unit}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">{product.unit}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">{product.taxRate}%</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const handleEditProduct = (product: SafeProduct): void => {
                            const productWithDefaults = {
                              ...product,
                              description: product.description || '',
                            };
                            setEditingProduct(productWithDefaults);
                            setShowProductForm(true);
                          };
                          handleEditProduct(product);
                        }}
                        className="p-2 text-yellow-600 hover:text-yellow-800 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(undefined);
          }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}