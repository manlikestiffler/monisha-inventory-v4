import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = {
  primary: ['#4ECDC4', '#45B7D1', '#96CEB4'],
  secondary: ['#FFD93D', '#FF6B6B', '#F38181'],
  accent: ['#6C63FF', '#8884d8', '#7158e2'],
  neutral: ['#4B4453', '#6D6875', '#8A817C']
};

const DynamicCharts = ({ products, orders, schools, batches, loading }) => {
  const [activeCategory, setActiveCategory] = useState('analytics');
  const [activeChart, setActiveChart] = useState('demand');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState({
    analytics: {
      demand: [],
      years: []
    },
    financials: {
      revenue: [],
      topProducts: []
    },
    schools: {
      inventoryPerSchool: [],
      ordersPerSchool: []
    }
  });

  // Process data when props change
  useEffect(() => {
    if (loading) return;
    
    processData();
  }, [products, orders, schools, batches, loading]);

  const processData = () => {
    const newChartData = {
      analytics: {
        demand: [],
        years: []
      },
      financials: {
        revenue: [],
        topProducts: []
      },
      schools: {
        inventoryPerSchool: [],
        ordersPerSchool: []
      }
    };

    // Process size demand data from batches
    processSizeDemandData(newChartData);
    
    // Process revenue data from orders
    processRevenueData(newChartData);
    
    // Process top products data
    processTopProductsData(newChartData);
    
    // Process inventory by school data
    processInventoryBySchoolData(newChartData);
    
    // Process orders by school data
    processOrdersBySchoolData(newChartData);
    
    setChartData(newChartData);
  };

  const processSizeDemandData = (newChartData) => {
    // Get unique years from orders
    const years = [...new Set(orders.map(order => {
      const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
      return date.getFullYear();
    }))].sort((a, b) => b - a); // Sort years descending
    
    newChartData.analytics.years = years.map(year => year.toString());
    
    // If no years found, use current year
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      newChartData.analytics.years = [currentYear.toString()];
      years.push(currentYear);
    }
    
    // Make sure selectedYear is valid
    if (!newChartData.analytics.years.includes(selectedYear)) {
      setSelectedYear(newChartData.analytics.years[0]);
    }
    
    // Process size demand for each year
    years.forEach(year => {
      // Get all orders from this year
      const yearOrders = orders.filter(order => {
        const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
        return date.getFullYear() === year;
      });
      
      // Count sales by size
      const sizeCount = {};
      
      yearOrders.forEach(order => {
        // Process items in the order
        order.items?.forEach(item => {
          if (item.size) {
            sizeCount[item.size] = (sizeCount[item.size] || 0) + (item.quantity || 1);
          }
        });
      });
      
      // Convert to array format
      const sizeDemand = Object.entries(sizeCount).map(([size, totalSales]) => {
        // Determine demand category based on sales volume
        let demandCategory = 'Low';
        let color = '#FF6B6B';
        
        if (totalSales > 150) {
          demandCategory = 'High';
          color = '#4ECDC4';
        } else if (totalSales > 75) {
          demandCategory = 'Medium';
          color = '#FFD93D';
        }
        
        return { size, totalSales, demandCategory, color };
      });
      
      // Sort by size (XS, S, M, L, XL, XXL)
      const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 };
      sizeDemand.sort((a, b) => {
        return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
      });
      
      newChartData.analytics.demand[year] = sizeDemand;
    });
  };

  const processRevenueData = (newChartData) => {
    // Group orders by month
    const monthlyRevenue = {};
    
    // Initialize all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyRevenue[month] = 0;
    });
    
    // Calculate revenue by month for the current year
    const currentYear = new Date().getFullYear();
    
    orders.forEach(order => {
      const date = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt?.seconds * 1000);
      
      // Only include orders from current year
      if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()];
        monthlyRevenue[month] += (order.totalAmount || 0);
      }
    });
    
    // Convert to array format
    const revenueData = months.map(month => ({
      month,
      revenue: monthlyRevenue[month]
    }));
    
    newChartData.financials.revenue = revenueData;
  };

  const processTopProductsData = (newChartData) => {
    // Count product sales
    const productSales = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productName = item.name || 'Unknown Product';
        productSales[productName] = (productSales[productName] || 0) + (item.quantity || 1);
      });
    });
    
    // Convert to array and sort by sales
    const topProducts = Object.entries(productSales)
      .map(([name, sales], index) => ({
        name,
        sales,
        color: COLORS.primary[index % COLORS.primary.length]
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Take top 5
    
    newChartData.financials.topProducts = topProducts;
  };

  const processInventoryBySchoolData = (newChartData) => {
    // Group inventory by school
    const schoolInventory = {};
    
    // Initialize with schools data
    schools.forEach(school => {
      schoolInventory[school.id] = {
        name: school.name || 'Unknown School',
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      };
    });
    
    // Process batch inventory
    batches.forEach(batch => {
      if (!batch.schoolId) return;
      
      // Skip if school doesn't exist in our data
      if (!schoolInventory[batch.schoolId]) {
        schoolInventory[batch.schoolId] = {
          name: 'Unknown School',
          inStock: 0,
          lowStock: 0,
          outOfStock: 0
        };
      }
      
      // Process items in the batch
      batch.items?.forEach(item => {
        item.sizes?.forEach(size => {
          const quantity = size.quantity || 0;
          
          if (quantity === 0) {
            schoolInventory[batch.schoolId].outOfStock += 1;
          } else if (quantity < 10) {
            schoolInventory[batch.schoolId].lowStock += 1;
          } else {
            schoolInventory[batch.schoolId].inStock += 1;
          }
        });
      });
    });
    
    // Convert to array format
    const inventoryBySchool = Object.values(schoolInventory)
      .filter(school => school.inStock > 0 || school.lowStock > 0 || school.outOfStock > 0)
      .sort((a, b) => {
        // Sort by total inventory
        const totalA = a.inStock + a.lowStock + a.outOfStock;
        const totalB = b.inStock + b.lowStock + b.outOfStock;
        return totalB - totalA;
      })
      .slice(0, 5); // Take top 5 schools
    
    newChartData.schools.inventoryPerSchool = inventoryBySchool;
  };

  const processOrdersBySchoolData = (newChartData) => {
    // Count orders by school
    const schoolOrders = {};
    
    // Initialize with schools data
    schools.forEach(school => {
      schoolOrders[school.id] = {
        name: school.name || 'Unknown School',
        value: 0,
        color: COLORS.accent[0]
      };
    });
    
    // Count orders by school
    orders.forEach(order => {
      if (!order.schoolId) return;
      
      // Skip if school doesn't exist in our data
      if (!schoolOrders[order.schoolId]) {
        schoolOrders[order.schoolId] = {
          name: 'Unknown School',
          value: 0,
          color: COLORS.accent[0]
        };
      }
      
      schoolOrders[order.schoolId].value += 1;
    });
    
    // Convert to array format and assign colors
    const ordersBySchool = Object.values(schoolOrders)
      .filter(school => school.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Take top 5 schools
      .map((school, index) => ({
        ...school,
        color: COLORS.accent[index % COLORS.accent.length]
      }));
    
    newChartData.schools.ordersPerSchool = ordersBySchool;
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const newChartId = chartConfig[category].charts[0].id;
    setActiveChart(newChartId); 
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-lg border border-slate-300 shadow-xl">
          <p className="text-slate-900 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || '#1e293b' }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Chart configuration
  const chartConfig = {
    analytics: {
      name: 'Size Analytics',
      charts: [
        { id: 'demand', name: 'Size Demand Pattern' },
      ],
    },
    financials: {
      name: 'Financials',
      charts: [
        { id: 'revenue', name: 'Revenue Trend' },
        { id: 'topProducts', name: 'Top Performing Products' },
      ],
    },
    schools: {
      name: 'Schools',
      charts: [
        { id: 'inventoryPerSchool', name: 'Inventory by School' },
        { id: 'ordersPerSchool', name: 'Orders by School' },
      ],
    },
  };
  
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    switch (activeChart) {
      // --- Size Analytics Charts ---
      case 'demand':
        const currentYearData = chartData.analytics.demand[selectedYear] || [];
        
        if (currentYearData.length === 0) {
          return (
            <div className="flex justify-center items-center h-[400px] text-muted-foreground">
              No size demand data available for {selectedYear}
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={currentYearData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="size" stroke="#475569" />
              <YAxis stroke="#475569" label={{ value: 'Total Units Sold', angle: -90, position: 'insideLeft', fill: '#475569', dy: 40 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalSales" name="Total Sales" radius={[4, 4, 0, 0]}>
                {currentYearData.map((entry) => <Cell key={entry.size} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      // --- Financials Charts ---
      case 'revenue':
        const revenueData = chartData.financials.revenue;
        
        if (revenueData.length === 0) {
          return (
            <div className="flex justify-center items-center h-[400px] text-muted-foreground">
              No revenue data available
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="month" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'topProducts':
        const topProductsData = chartData.financials.topProducts;
        
        if (topProductsData.length === 0) {
          return (
            <div className="flex justify-center items-center h-[400px] text-muted-foreground">
              No product sales data available
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProductsData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis type="number" stroke="#475569" />
              <YAxis dataKey="name" type="category" stroke="#475569" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" name="Units Sold" radius={[0, 4, 4, 0]}>
                 {topProductsData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      // --- School Analytics Charts ---
      case 'inventoryPerSchool':
        const inventoryBySchoolData = chartData.schools.inventoryPerSchool;
        
        if (inventoryBySchoolData.length === 0) {
          return (
            <div className="flex justify-center items-center h-[400px] text-muted-foreground">
              No inventory by school data available
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={inventoryBySchoolData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis type="number" stroke="#475569" />
              <YAxis dataKey="name" type="category" stroke="#475569" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="inStock" name="In Stock" stackId="a" fill="#4ECDC4" />
              <Bar dataKey="lowStock" name="Low Stock" stackId="a" fill="#FFD93D" />
              <Bar dataKey="outOfStock" name="Out of Stock" stackId="a" fill="#FF6B6B" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'ordersPerSchool':
        const ordersBySchoolData = chartData.schools.ordersPerSchool;
        
        if (ordersBySchoolData.length === 0) {
          return (
            <div className="flex justify-center items-center h-[400px] text-muted-foreground">
              No orders by school data available
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={ordersBySchoolData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {ordersBySchoolData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default: return null;
    }
  };

  return (
    <div className="w-full">
      {/* --- Main Category Toggles --- */}
      <div className="flex gap-4 mb-4 border-b border-slate-200 pb-3">
        {Object.keys(chartConfig).map((key) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={`px-4 py-2 rounded-t-lg text-lg font-semibold transition-all duration-300 ${
              activeCategory === key
                ? 'text-slate-800 border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {chartConfig[key].name}
          </button>
        ))}
      </div>

      {/* --- Sub-chart Toggles --- */}
      <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {chartConfig[activeCategory].charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeChart === chart.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chart.name}
              </button>
            ))}
          </div>

          {/* --- YEAR TOGGLE (Conditional) --- */}
          {activeChart === 'demand' && activeCategory === 'analytics' && chartData.analytics.years.length > 0 && (
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white/80 border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 appearance-none"
              >
                {chartData.analytics.years.map(year => (
                  <option key={year} value={year} className="bg-white text-slate-900">
                    {year}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          )}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderChart()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DynamicCharts;