import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Package, Layers, Droplets } from 'lucide-react';
import { useThemeDetector } from '../hooks/useThemeDetector';
import LoadingScreen from '../components/ui/LoadingScreen';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDark = useThemeDetector();

  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        const uniformsSnapshot = await getDocs(collection(db, 'uniforms'));
        const materialsSnapshot = await getDocs(collection(db, 'raw_materials'));

        const uniforms = uniformsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, productType: 'Uniform' }));
        const materials = materialsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, productType: 'Raw Material' }));
        
        const combinedData = [...uniforms, ...materials];
        
        // Process data for charts
        const categoryCount = combinedData.reduce((acc, item) => {
          const category = item.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.keys(categoryCount).map(key => ({
          name: key,
          count: categoryCount[key],
        }));

        setInventoryData(chartData);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'inventory') {
      fetchInventoryData();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schools', label: 'School Analytics' },
    { id: 'inventory', label: 'Inventory Analysis' },
    { id: 'quality', label: 'Quality Metrics' },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingScreen message="Loading Reports" description="Please wait while we generate your reports" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="mt-4 text-red-500">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'inventory':
        return (
          <motion.div variants={itemVariants} className="bg-white dark:bg-black rounded-lg shadow p-6 border dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Inventory by Category</h2>
            <div style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#4B5563"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#4B5563"} />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(243, 244, 246, 0.5)' }}
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend wrapperStyle={{ color: isDark ? '#D1D5DB' : '#374151' }} />
                  <Bar dataKey="count" fill={isDark ? '#60A5FA' : '#3B82F6'} name="Product Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      default:
        return (
          <div className="text-center py-16 bg-white dark:bg-black rounded-lg shadow border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Coming Soon</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This report is under construction. Check back later!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics & Reports</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          In-depth analysis of your inventory and operations.
        </p>
      </div>

      <div className="mb-8">
        <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;