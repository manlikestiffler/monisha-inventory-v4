import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useThemeDetector } from '../hooks/useThemeDetector';
import LoadingScreen from '../components/ui/LoadingScreen';
import SchoolSelect from '../components/SchoolSelect';

const Reports = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState('');
  const isDark = useThemeDetector();

  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const uniformsSnapshot = await getDocs(collection(db, 'uniforms'));
        let uniforms = uniformsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        if (selectedSchool) {
          uniforms = uniforms.filter(item => item.school === selectedSchool);
        }

        const typeCount = uniforms.reduce((acc, item) => {
          const type = item.type || 'Uncategorized';
          let totalQuantity = 0;
          if (item.variants && item.variants.length > 0) {
            totalQuantity = item.variants.reduce((sum, variant) => {
              return sum + variant.sizes.reduce((s, size) => s + Number(size.quantity || 0), 0);
            }, 0);
          }
          acc[type] = (acc[type] || 0) + totalQuantity;
          return acc;
        }, {});

        const variantCount = uniforms.reduce((acc, item) => {
          if (item.variants) {
            item.variants.forEach(variant => {
              const variantName = `${item.name} (${variant.variant})`;
              const variantQuantity = variant.sizes.reduce((s, size) => s + Number(size.quantity || 0), 0);
              if (variantQuantity > 0) {
                acc[variantName] = (acc[variantName] || 0) + variantQuantity;
              }
            });
          }
          return acc;
        }, {});

        const typeChartData = Object.keys(typeCount)
          .map(key => ({ name: key, count: typeCount[key] }))
          .filter(item => item.count > 0);

        const variantChartData = Object.keys(variantCount)
          .map(key => ({ name: key, count: variantCount[key] }))
          .filter(item => item.count > 0);
        
        setInventoryData(typeChartData);
        setVariantData(variantChartData);

      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [selectedSchool]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-96">
          <LoadingScreen message="Generating Reports..." />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-96 text-red-500">
          <AlertTriangle className="w-12 h-12" />
          <p className="mt-4">{error}</p>
        </div>
      );
    }

    const noData = inventoryData.length === 0 && variantData.length === 0;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="mb-6">
          <SchoolSelect onChange={setSelectedSchool} value={selectedSchool} />
        </div>
        {noData ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800/20 rounded-lg shadow-inner border dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">No Data Available</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              There is no inventory data for the selected school.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-2xl"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Inventory by Uniform Type</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={inventoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb"} />
                  <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#4B5563"} tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#4B5563"} tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.75rem',
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: isDark ? '#D1D5DB' : '#374151' }} />
                  <Bar dataKey="count" fill="url(#barGradient)" name="Total Quantity" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-2xl"
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Inventory by Variants</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart layout="vertical" data={variantData} margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                   <defs>
                    <linearGradient id="variantBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb"} />
                  <XAxis type="number" stroke={isDark ? "#9CA3AF" : "#4B5563"} tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }} />
                  <YAxis type="category" dataKey="name" stroke={isDark ? "#9CA3AF" : "#4B5563"} tick={{ fill: isDark ? '#9CA3AF' : '#4B5563', fontSize: 12 }} width={150} />
                  <Tooltip
                    cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.75rem',
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: isDark ? '#D1D5DB' : '#374151' }} />
                  <Bar dataKey="count" fill="url(#variantBarGradient)" name="Variant Quantity" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Analytics & Reports</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            In-depth analysis of your inventory and operations.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key="inventory-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;