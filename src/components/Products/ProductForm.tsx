import React, { useState } from 'react';
import { X, Save, Package, DollarSign, Tag, FileText } from 'lucide-react';

// Define Product interface to match database schema
interface Product {
  id: string;
  name: string;
  description: string;
  rate: number;
  unit: string;
  category: string;
  isService: boolean;
  taxRate: number;
}

interface ProductFormProps {
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product;
}

export default function ProductForm({ onClose, onSave, product }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    rate: product?.rate || 0,
    unit: product?.unit || 'hour',
    category: product?.category || 'General',
    isService: product?.isService ?? true,
    taxRate: product?.taxRate || 8.5
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'General',
    'Development',
    'Design',
    'Consulting',
    'Marketing',
    'Software',
    'Hardware',
    'Training',
    'Support',
    'Other'
  ];

  const units = [
    'hour',
    'day',
    'week',
    'month',
    'project',
    'piece',
    'license',
    'subscription',
    'session',
    'consultation'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product/Service name is required';
    }

    if (formData.rate <= 0) {
      newErrors.rate = 'Rate must be greater than 0';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const productData: Partial<Product> = {
      ...formData,
      stockQuantity: formData.isService ? undefined : formData.stockQuantity
    };

    onSave(productData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                Rate
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  id="rate"
                  value={formData.rate}
                  onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.01"
                  min="0"
                />
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              {errors.rate && <p className="text-red-500 text-sm mt-1">{errors.rate}</p>}
              {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit}</p>}
            </div>

            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  id="taxRate"
                  value={formData.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.taxRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="text-gray-600">%</span>
              </div>
              {errors.taxRate && <p className="text-red-500 text-sm mt-1">{errors.taxRate}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter product description..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save className="h-5 w-5 inline-block align-text-top mr-2" />
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}