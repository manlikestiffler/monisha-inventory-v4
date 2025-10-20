import { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const ReorderModal = ({ isOpen, onClose, variant, size, currentStock, reorderLevel, batchId }) => {
  const [quantityToReorder, setQuantityToReorder] = useState(reorderLevel ? reorderLevel * 2 : 10);
  const [loading, setLoading] = useState(false);
  const [batchStock, setBatchStock] = useState(null);
  const [loadingBatchStock, setLoadingBatchStock] = useState(false);
  const [noBatchIdError, setNoBatchIdError] = useState(false);
  const { reorderFromBatch } = useInventoryStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      // Set default reorder quantity to 2x reorder level
      setQuantityToReorder(reorderLevel ? reorderLevel * 2 : 10);
      // Fetch batch inventory stock
      fetchBatchStock();
    }
  }, [isOpen, reorderLevel]);

  const fetchBatchStock = async () => {
    if (!batchId || !variant) {
      console.error('Missing batchId or variant:', { batchId, variant });
      setNoBatchIdError(true);
      return;
    }

    setLoadingBatchStock(true);
    try {
      const batchRef = doc(db, 'batchInventory', batchId);
      const batchDoc = await getDoc(batchRef);
      
      if (!batchDoc.exists()) {
        toast.error('Batch inventory not found');
        return;
      }
      
      const batchData = batchDoc.data();
      console.log('Batch data:', batchData);
      console.log('Looking for variant:', { variantType: variant.variantType, color: variant.color, size });
      
      // Find matching batch item
      const matchingItem = batchData.items?.find(item => 
        item.variantType === variant.variantType && item.color === variant.color
      );
      
      if (matchingItem) {
        const matchingSize = matchingItem.sizes?.find(s => s.size === size);
        if (matchingSize) {
          setBatchStock(matchingSize.quantity);
          console.log('Found batch stock:', matchingSize.quantity, 'for size', size);
        } else {
          console.warn('Size not found in batch item');
        }
      } else {
        console.warn('Matching item not found in batch');
      }
    } catch (error) {
      console.error('Error fetching batch stock:', error);
      toast.error('Failed to fetch batch inventory');
    } finally {
      setLoadingBatchStock(false);
    }
  };

  const handleReorder = async () => {
    console.log('🔄 Reorder clicked with:', { batchId, variant, size, quantityToReorder });
    
    if (!batchId) {
      toast.error('No batch ID found. Cannot reorder.');
      return;
    }

    if (quantityToReorder <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (batchStock !== null && quantityToReorder > batchStock) {
      toast.error(`Cannot reorder ${quantityToReorder} units. Only ${batchStock} available in batch.`);
      return;
    }

    setLoading(true);
    try {
      await reorderFromBatch(
        variant.id,
        batchId,
        size,
        quantityToReorder,
        user?.uid || 'unknown',
        user?.email || 'Unknown User'
      );

      toast.success(`Successfully reordered ${quantityToReorder} units of size ${size}`);
      onClose();
      // Refresh the page to show updated stock
      window.location.reload();
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error(error.message || 'Failed to reorder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stockStatus = currentStock === 0 ? 'OUT_OF_STOCK' : currentStock <= reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';

  // Show error if no batch ID is available
  if (noBatchIdError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cannot Reorder
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Missing Batch Information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Error Message */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <h3 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">
              This product was not created from a batch
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300">
              This product doesn't have batch information attached to it. To enable reordering:
            </p>
            <ul className="text-xs text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
              <li>Delete this product and recreate it from a batch, OR</li>
              <li>Manually add stock by editing the product quantities</li>
            </ul>
          </div>

          {/* Product Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Color:</span>
                <span className="font-medium text-gray-900 dark:text-white">{variant?.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                <span className="font-medium text-gray-900 dark:text-white">{size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                <span className="font-medium text-gray-900 dark:text-white">{currentStock}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${
              stockStatus === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-600' :
              stockStatus === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            }`}>
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reorder Stock
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {variant.color} - Size {size}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Batch Stock Info */}
        {loadingBatchStock ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading batch inventory...</span>
          </div>
        ) : batchStock !== null ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Available in Batch:
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {batchStock} units
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Size {size} • {variant.color}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Could not find batch inventory for this item
            </p>
          </div>
        )}

        {/* Stock Status Alert */}
        <div className={`p-4 rounded-xl flex items-start space-x-3 ${
          stockStatus === 'OUT_OF_STOCK' ? 'bg-red-50 border border-red-200' :
          stockStatus === 'LOW_STOCK' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
            stockStatus === 'OUT_OF_STOCK' ? 'text-red-600' :
            stockStatus === 'LOW_STOCK' ? 'text-yellow-600' :
            'text-blue-600'
          }`} />
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${
              stockStatus === 'OUT_OF_STOCK' ? 'text-red-900' :
              stockStatus === 'LOW_STOCK' ? 'text-yellow-900' :
              'text-blue-900'
            }`}>
              {stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' :
               stockStatus === 'LOW_STOCK' ? 'Low Stock Alert' :
               'Restock Inventory'}
            </h3>
            <p className={`text-xs mt-1 ${
              stockStatus === 'OUT_OF_STOCK' ? 'text-red-700' :
              stockStatus === 'LOW_STOCK' ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              Current stock: <span className="font-semibold">{currentStock}</span> | 
              Reorder level: <span className="font-semibold">{reorderLevel}</span>
            </p>
          </div>
        </div>

        {/* Reorder Quantity Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity to Reorder
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={quantityToReorder}
              onChange={(e) => setQuantityToReorder(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter quantity"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              units
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Suggested: {reorderLevel ? reorderLevel * 2 : 10} units (2x reorder level)
          </p>
        </div>

        {/* Stock After Reorder Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Stock after reorder:
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                {currentStock + quantityToReorder}
              </span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReorder}
            disabled={loading || quantityToReorder <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Reordering...</span>
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                <span>Reorder {quantityToReorder} Units</span>
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          This will deduct from batch inventory and add to product inventory
        </p>
      </div>
    </div>
  );
};

export default ReorderModal;
