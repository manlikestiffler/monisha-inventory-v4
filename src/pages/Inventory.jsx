import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  Plus, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Box,
  Layers
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import DetailedInventoryAnalysis from '../components/dashboard/DetailedInventoryAnalysis';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useInventoryStore } from '../stores/inventoryStore';
import { collection, getDocs, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUniformIcon } from '../constants/icons';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/ui/Modal';

// Get unique categories from products
const getUniqueCategories = (products) => {
  return [...new Set(products.map(product => product.category))].filter(Boolean);
};

// Enhanced helper function to calculate detailed stock status
const calculateStockStatus = (variants) => {
  if (!Array.isArray(variants)) {
    return { type: 'unknown', message: 'Status Unknown', details: [] };
  }

  let variantStatuses = [];

  variants.forEach(variant => {
    if (!variant?.sizes || !Array.isArray(variant.sizes)) return;

    const variantName = variant.variantType || 'Unknown';
    let totalQuantity = 0;
    let status = 'in_stock';

    variant.sizes.forEach(size => {
      const quantity = Number(size?.quantity) || 0;
      totalQuantity += quantity;
    });

    if (totalQuantity === 0) {
      status = 'out_of_stock';
    } else if (totalQuantity < 5) {
      status = 'low_stock';
    }

    variantStatuses.push({
      name: variantName,
      status,
      quantity: totalQuantity
    });
  });

  return {
    details: variantStatuses,
    type: variantStatuses.some(v => v.status === 'out_of_stock') ? 'error' :
          variantStatuses.some(v => v.status === 'low_stock') ? 'warning' : 'success'
  };
};

const getDefaultProductImage = (name, type) => {
  const bgColors = {
    'Shirt': '4299e1',  // blue-500
    'Trouser': '48bb78', // green-500
    'Blazer': '9f7aea', // purple-500
    'Skirt': 'ed64a6',  // pink-500
    'Tie': 'f56565',    // red-500
    'default': 'a0aec0'  // gray-500
  };

  const bgColor = bgColors[type] || bgColors.default;
  const textColor = 'ffffff'; // white text
  
  // Create a more visually appealing placeholder with the product name and type
  const displayText = `${name}\n(${type})`;
  return `https://placehold.co/400x400/${bgColor}/${textColor}?text=${encodeURIComponent(displayText)}`;
};

const getProductImage = (product) => {
  if (product.imageUrl && product.imageUrl.startsWith('http')) {
    return product.imageUrl;
  }
  
  if (product.imageUrl && product.imageUrl.startsWith('gs://')) {
    // Convert Firebase Storage URL if needed
    return product.imageUrl;
  }
  
  return getDefaultProductImage(product.name, product.type);
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [error, setError] = useState(null);
  const [schoolsMap, setSchoolsMap] = useState({});
  const { isManager } = useAuthStore();

  const { deleteProduct } = useInventoryStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch schools and create a map of id to name
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, 'schools'));
        const schoolsData = {};
        schoolsSnapshot.docs.forEach(doc => {
          schoolsData[doc.id] = doc.data().name;
        });
        setSchoolsMap(schoolsData);
        console.log('Schools map:', schoolsData); // Debug log
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, []);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const materialsSnapshot = await getDocs(collection(db, 'materials'));
        const materialsList = materialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterials(materialsList);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchMaterials();
  }, []);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchesSnapshot = await getDocs(
          query(collection(db, 'batches'), orderBy('createdAt', 'desc'))
        );
        const batchesList = batchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBatches(batchesList);
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };

    fetchBatches();
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch users from both staff and managers collections
        const staffSnapshot = await getDocs(collection(db, 'inventory_staff'));
        const managersSnapshot = await getDocs(collection(db, 'inventory_managers'));
        const usersMap = {};
        
        const processSnapshot = (snapshot) => {
          snapshot.forEach(doc => {
            const data = doc.data();
            usersMap[doc.id] = {
              ...data,
              name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.displayName,
            };
          });
        };

        processSnapshot(staffSnapshot);
        processSnapshot(managersSnapshot);

        console.log('Users map:', usersMap); // Debug log for usersMap

        // Fetch uniforms
        const uniformsQuery = query(
          collection(db, 'uniforms'),
          orderBy('createdAt', 'desc')
        );
        
        const uniformsSnapshot = await getDocs(uniformsQuery);
        
        const uniformsData = uniformsSnapshot.docs.map(doc => {
          const data = doc.data();
          const creatorInfo = usersMap[data.createdByUid] || { name: 'N/A', role: 'N/A' };
          
          return {
            id: doc.id,
            ...data,
            creatorName: creatorInfo.name,
            creatorRole: creatorInfo.role,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        });

        // Fetch raw materials
        const materialsQuery = query(
          collection(db, 'raw_materials'),
          orderBy('createdAt', 'desc')
        );
        
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialsData = materialsSnapshot.docs.map(doc => {
          const data = doc.data();
          const creatorInfo = usersMap[data.createdByUid] || { name: 'N/A', role: 'N/A' };
          return {
            id: doc.id,
            ...data,
            variants: [], // Raw materials don't have variants
            creatorName: creatorInfo.name,
            creatorRole: creatorInfo.role,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        });
        
        const allProducts = [...uniformsData, ...materialsData];
        setProducts(allProducts);
        
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    navigate(`/inventory/edit/${product.id}`);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        const isRawMaterial = productToDelete.type === 'raw_material';
        await deleteProduct(productToDelete.id, isRawMaterial);
        // Update local state after successful deletion
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
        setShowDeleteModal(false);
        setProductToDelete(null);
      } catch (error) {
        console.error("Delete error:", error);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  // Export functions
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Add headers
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'School', key: 'school', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Stock', key: 'stock', width: 15 },
      { header: 'Created By', key: 'creator', width: 25 },
      { header: 'Created At', key: 'date', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    products.forEach(product => {
      worksheet.addRow({
        name: product.name,
        category: product.category,
        school: product.schoolName,
        type: product.type,
        status: calculateStockStatus(product.variants).type,
        stock: product.variants.reduce((total, variant) => 
          total + variant.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0), 0),
        creator: product.creatorName,
        date: product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : 'Unknown'
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_report.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText('Inventory Report', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });

    // Add content
    let yOffset = height - 100;
    products.forEach((product, index) => {
      const stockStatus = calculateStockStatus(product.variants);
      const text = `${index + 1}. ${product.name} - ${product.category} - ${stockStatus.type}`;
      page.drawText(text, {
        x: 50,
        y: yOffset,
        size: 12,
        color: rgb(0, 0, 0),
      });
      yOffset -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_report.pdf';
    link.click();
  };

  // Enhanced filtering
  const filteredProducts = products.filter((product) => {
    console.log('Filtering product:', product); // Debug log for each product

    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSchool = schoolFilter === 'all' || product.school === schoolFilter;
    
    console.log('Search match:', matchesSearch);
    console.log('Category match:', matchesCategory);
    console.log('School match:', matchesSchool);
    
    return matchesSearch && matchesCategory && matchesSchool;
  });

  console.log('Final filtered products:', filteredProducts); // Debug log for final results

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const handleViewDetails = (product) => {
    navigate(`/inventory/${product.id}`);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const cardVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  if (loading) {
    return <LoadingScreen message="Loading Inventory" description="Please wait while we fetch the inventory data" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-24 w-24 text-red-500 mb-6"
        >
          <AlertTriangle className="w-full h-full" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Inventory</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-background dark:bg-black"
    >
      {/* ... existing breadcrumb ... */}

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card dark:bg-black rounded-3xl shadow-xl border border-border dark:border-gray-700 overflow-hidden"
          >
          <div className="p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Inventory Management
                </h1>
                <p className="mt-2 text-muted-foreground text-lg">
                  Track and manage your uniform inventory efficiently
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <Button 
                    onClick={() => document.getElementById('exportDropdown').classList.toggle('hidden')}
                    className="group bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export</span>
                  </Button>
                  <div id="exportDropdown" className="hidden absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={async () => {
                          try {
                            await exportToExcel();
                          } catch (error) {
                            console.error('Error exporting to Excel:', error);
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export to Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <FileText className="w-4 h-4" />
                        Export to PDF
                      </button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/inventory/add')} 
                  className="group bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                >
                  <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                  <span className="font-medium">Add New Product</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards with Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const allProducts = products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "Total Products",
                    products: allProducts,
                    type: "all"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{products.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const inStockProducts = products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "In Stock Products",
                    products: inStockProducts,
                    type: "in_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Stock</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const lowStockProducts = products.filter(p => calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "Low Stock Products",
                    products: lowStockProducts,
                    type: "low_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {products.filter(p => calculateStockStatus(p.variants).type.includes('low_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const outOfStockProducts = products.filter(p => calculateStockStatus(p.variants).type.includes('out_of_stock'));
                  setSelectedProducts({
                    title: "Out of Stock Products",
                    products: outOfStockProducts,
                    type: "out_of_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                    <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                      {products.filter(p => calculateStockStatus(p.variants).type.includes('out_of_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stock Details Modal */}
            <AnimatePresence>
              {showModal && selectedProducts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedProducts.title}</h2>
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-500" />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                      <div className="space-y-6">
                        {selectedProducts.products.map((product) => (
                          <div key={product.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <img
                                  src={getProductImage(product)}
                                  alt={product.name}
                                  className="w-16 h-16 rounded-xl object-cover"
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.name}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.type}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewDetails(product)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {product.variants.map((variant, idx) => {
                                const variantStatus = calculateStockStatus([variant]);
                                if (
                                  (selectedProducts.type === "out_of_stock" && variantStatus.type !== "out_of_stock") ||
                                  (selectedProducts.type === "low_stock" && variantStatus.type !== "low_stock") ||
                                  (selectedProducts.type === "in_stock" && (variantStatus.type === "out_of_stock" || variantStatus.type === "low_stock"))
                                ) {
                                  return null;
                                }
                                return (
                                  <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-gray-900 dark:text-gray-100">{variant.variantType}</span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        variantStatus.type === 'out_of_stock' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
                                        variantStatus.type === 'low_stock' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                                        'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                      }`}>
                                        {variantStatus.details[0].quantity} in stock
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Sizes: {variant.sizes.map(s => `${s.size} (${s.quantity})`).join(', ')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-black rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <DetailedInventoryAnalysis 
                data={{
                  schools,
                  inventory: products,
                  materials,
                  batches
                }}
                filters={{
                  category: categoryFilter,
                  school: schoolFilter,
                  material: materialFilter,
                  batch: batchFilter
                }}
                searchQuery={searchTerm}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Filters and Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories(products).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Schools</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Materials</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>Batch #{batch.batchNumber}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Product</th>
                  <th scope="col" className="px-6 py-3">Category</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3">Gender</th>
                  <th scope="col" className="px-6 py-3">Creator</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={getProductImage(product)} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{product.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.school ? schoolsMap[product.school] : 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{product.category || 'N/A'}</td>
                    <td className="px-6 py-4">{product.type || 'N/A'}</td>
                    <td className="px-6 py-4">{product.gender || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{product.creatorName || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.creatorRole || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={calculateStockStatus(product.variants).type}>
                        {calculateStockStatus(product.variants).type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center space-x-4">
                        <button onClick={() => handleViewDetails(product)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200"><Eye size={18} /></button>
                        {isManager() && (
                          <>
                            <button onClick={() => handleEdit(product)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(product)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Batch Management Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBatchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Batch Management</h2>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-6">
                  {batches.map((batch) => (
                    <div key={batch.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{batch.batchNumber}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Created on {new Date(batch.createdAt.toDate()).toLocaleDateString()}</p>
                        </div>
                        <Badge
                          variant={
                            batch.status === 'completed' ? 'success' :
                            batch.status === 'in_progress' ? 'warning' :
                            'error'
                          }
                        >
                          {batch.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batch.products.map((product, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Qty: {product.quantity}</span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Material: {product.material}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Inventory;