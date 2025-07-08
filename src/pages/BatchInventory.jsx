import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { useBatchStore } from '../stores/batchStore';
import { useSchoolStore } from '../stores/schoolStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Search, Plus, Filter, FileText, Edit2, Trash2, TrendingUp, Package, DollarSign, BarChart2, X, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingScreen from '../components/ui/LoadingScreen';
import Modal from '../components/ui/Modal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const BatchInventory = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isManager } = useAuthStore();
  const { deleteBatch } = useBatchStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localBatches, setLocalBatches] = useState([]);
  const [analytics, setAnalytics] = useState({ totalBatches: 0, totalValue: 0, totalItems: 0 });
  const [creatorNames, setCreatorNames] = useState({});

  const formatCreatorName = (email) => {
    if (!email) return 'N/A';
    const name = email.split('@')[0];
    return name.replace(/[._]/g, ' ')
               .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'batchInventory'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const batchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBatches(batchesData);
      setLocalBatches(batchesData);
      setLoading(false);

      const creatorEmails = [...new Set(batchesData.map(b => b.createdBy).filter(Boolean))];

      if (creatorEmails.length > 0) {
        const namesMap = { ...creatorNames };
        const emailsToFetch = creatorEmails.filter(email => !namesMap[email]);

        if (emailsToFetch.length > 0) {
          const fetchNames = async (emails, collectionName) => {
            const fetchedNames = {};
            const profilesRef = collection(db, collectionName);
            // Firestore 'in' query supports up to 30 elements in the array
            const chunks = [];
            for (let i = 0; i < emails.length; i += 30) {
              chunks.push(emails.slice(i, i + 30));
            }
            for (const chunk of chunks) {
              const userQuery = query(profilesRef, where('email', 'in', chunk));
              const querySnapshot = await getDocs(userQuery);
              querySnapshot.forEach(doc => {
                const profile = doc.data();
                const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                if (profile.email) {
                  fetchedNames[profile.email] = fullName || profile.displayName;
                }
              });
            }
            return fetchedNames;
          };

          const staffNames = await fetchNames(emailsToFetch, 'staffs');
          const managerNames = await fetchNames(emailsToFetch, 'managers');
          
          setCreatorNames(prev => ({ ...prev, ...staffNames, ...managerNames }));
        }
      }
    }, (error) => {
      console.error("Error fetching batches:", error);
      setError('Failed to load batches.');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setLocalBatches(batches);
  }, [batches]);

  const filteredBatches = localBatches.filter(batch =>
    batch && (
      (batch?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch?.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch?.createdBy?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteClick = (batch) => {
    if (!batch?.id) {
      // For undefined batches, remove them directly from local state
      setLocalBatches(prev => prev.filter(b => b !== batch));
      return;
    }
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteBatch(batchToDelete.id);
      // Update local state immediately
      setLocalBatches(prev => prev.filter(batch => batch.id !== batchToDelete.id));
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error('Error deleting batch:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading Batches" description="Please wait while we fetch the batch data" />;
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Batches</h2>
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Batch Inventory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your uniform batches</p>
        </div>
        {isManager() && (
          <Button
            onClick={() => navigate('/batches/create')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Batch
          </Button>
        )}
      </div>

      {/* Analytics Cards */}
      <motion.div
        className="grid grid-cols-3 gap-6 dark:bg-black"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-black dark:to-black p-6 rounded-2xl border border-blue-100 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Batches</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{filteredBatches.length}</div>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-black dark:to-black p-6 rounded-2xl border border-purple-100 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {filteredBatches.reduce((sum, batch) => 
              sum + (batch?.items?.reduce((itemSum, item) => 
                itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + (size?.quantity || 0), 0) || 0), 0) || 0), 0
            )} pcs
          </div>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-black dark:to-black p-6 rounded-2xl border border-emerald-100 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Value</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ${filteredBatches.reduce((sum, batch) => sum + (batch?.items?.reduce((itemSum, item) => 
              itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + ((size?.quantity || 0) * (item?.price || 0)), 0) || 0), 0) || 0), 0).toLocaleString()}
          </div>
        </motion.div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search batches..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Batch"
      >
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You are about to delete the batch <span className="font-semibold text-gray-800 dark:text-gray-200">{batchToDelete?.name}</span>. 
              This action is irreversible.
            </p>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Batch'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch List */}
      <div className="mt-6">
        {filteredBatches.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-black rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-black dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Batch</th>
                    <th scope="col" className="px-6 py-3">Items</th>
                    <th scope="col" className="px-6 py-3">Value</th>
                    <th scope="col" className="px-6 py-3">Creator</th>
                    <th scope="col" className="px-6 py-3">Created</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => {
                    const totalItems = batch.items?.reduce((sum, item) => sum + item.sizes?.reduce((sizeSum, size) => sizeSum + (size.quantity || 0), 0), 0) || 0;
                    const totalValue = batch.items?.reduce((sum, item) => sum + item.sizes?.reduce((sizeSum, size) => sizeSum + ((size.quantity || 0) * (item.price || 0)), 0), 0) || 0;
                    const isDepleted = totalItems === 0;
                    return (
                      <tr key={batch.id} className={`${isDepleted ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-black'} border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600`}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                            {batch.name}
                            {isDepleted && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Depleted
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{batch.type}</div>
                        </td>
                        <td className="px-6 py-4">{totalItems} pcs</td>
                        <td className="px-6 py-4">${totalValue.toFixed(2)}</td>
                        <td className="px-6 py-4">{creatorNames[batch.createdBy] || formatCreatorName(batch.createdBy)}</td>
                        <td className="px-6 py-4">{new Date(batch.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/batches/${batch.id}`)}>View</Button>
                            {isManager() && (
                              <>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-100 dark:text-red-500 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(batch)}>Delete</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 dark:text-gray-400"
            >
              No batches found.
            </motion.div>
          )
        )}
      </div>
    </div>
  );
};

export default BatchInventory;