import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, School, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

const LEVEL_CATEGORIES = {
  JUNIOR: 'JUNIOR',
  SENIOR: 'SENIOR'
};

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' }
];

const StudentModal = ({ isOpen, onClose, school, initialData, onSave, availableUniforms = [] }) => {
  const [step, setStep] = useState(1); // Step 1: Student Info, Step 2: Uniform Selection
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState({
    name: '',
    level: LEVEL_CATEGORIES.JUNIOR,
    gender: 'MALE',
    guardianPhone: '',
    uniformStatus: {},
    uniformQuantities: {},
    uniformSizes: {},
    ...initialData
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setStudentData(initialData);
    } else {
      // Initialize uniform status and quantities for new students
      const initialUniformStatus = {};
      const initialUniformQuantities = {};
      if (school?.uniformRequirements?.[studentData.level]) {
        Object.entries(school.uniformRequirements[studentData.level]).forEach(([category, items]) => {
          items.forEach((item, index) => {
            const key = `${category}-${index}`;
            initialUniformStatus[key] = 'pending';
            initialUniformQuantities[key] = item?.quantityPerStudent || 1;
          });
        });
      }
      setStudentData(prev => ({
        ...prev,
        uniformStatus: initialUniformStatus,
        uniformQuantities: initialUniformQuantities
      }));
    }
  }, [initialData, school, studentData.level]);

  useEffect(() => {
    // Debug logs
    console.log('School data:', school);
    console.log('Uniform requirements:', school?.uniformRequirements);
    console.log('Current level:', studentData.level);
    console.log('Current gender:', studentData.gender);
    console.log('Available uniforms:', availableUniforms);
    if (school?.uniformRequirements) {
      console.log('Uniforms for current level:', school.uniformRequirements[studentData.level]);
      const category = studentData.gender === 'MALE' ? 'BOYS' : 'GIRLS';
      console.log('Trying to access uniforms with:', category);
      console.log('Available uniforms for category:', school.uniformRequirements[studentData.level]?.[category]);
    }
  }, [school, studentData.level, studentData.gender, availableUniforms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleUniformStatusChange = (category, index, status) => {
    setStudentData(prev => ({
      ...prev,
      uniformStatus: {
        ...prev.uniformStatus,
        [`${category}-${index}`]: status
      }
    }));
  };

  const handleQuantityChange = (category, index, change) => {
    const key = `${category}-${index}`;
    const currentQuantity = studentData.uniformQuantities[key] || 1;
    const newQuantity = Math.max(1, currentQuantity + change);
    
    setStudentData(prev => ({
      ...prev,
      uniformQuantities: {
        ...prev.uniformQuantities,
        [key]: newQuantity
      }
    }));
  };

  const handleSizeChange = (category, index, size) => {
    setStudentData(prev => ({
      ...prev,
      uniformSizes: {
        ...prev.uniformSizes,
        [`${category}-${index}`]: size
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we're editing (initialData exists), or we're on step 2, save the data
    if (initialData || step === 2) {
      try {
        setLoading(true);
        await onSave(studentData);
        onClose();
      } catch (error) {
        console.error('Error saving student:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // If we're on step 1 and adding a new student, proceed to step 2
    if (!studentData.name || !studentData.gender || !studentData.level || !studentData.guardianPhone) {
      return;
    }
    setStep(2);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { duration: 0.2 } 
    }
  };

  const contentVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    },
    exit: {
      x: -20,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          className="bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-1">
              {!initialData && (
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              )}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">
                  {initialData ? 'Edit Student' : (step === 1 ? 'Student Information' : 'Uniform Selection')}
                </h2>
                {!initialData && (
                  <p className="text-sm text-gray-400 mt-1">
                    Step {step} of 2
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              <AnimatePresence mode="wait">
                {(step === 1) ? (
                  <motion.div
                    key="step1"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={contentVariants}
                    className="space-y-6"
                  >
                    {/* Student Information Form */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <User size={16} className="text-red-400" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={studentData.name}
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-100 placeholder-gray-500"
                          placeholder="Enter student's full name"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <School size={16} className="text-red-400" />
                            Level
                          </label>
                          <select
                            name="level"
                            value={studentData.level}
                            onChange={handleChange}
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-100"
                          >
                            <option value="JUNIOR">Junior</option>
                            <option value="SENIOR">Senior</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <User size={16} className="text-red-400" />
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={studentData.gender}
                            onChange={handleChange}
                            className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-100"
                          >
                            {GENDER_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Phone size={16} className="text-red-400" />
                          Guardian's Phone
                        </label>
                        <input
                          type="tel"
                          name="guardianPhone"
                          value={studentData.guardianPhone}
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-100 placeholder-gray-500"
                          placeholder="Enter guardian's phone number"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={contentVariants}
                    className="space-y-6"
                  >
                    {/* Uniform Selection */}
                    <div className="space-y-4">
                      {Object.entries(school.uniformRequirements?.[studentData.level] || {}).map(([category, items]) => {
                        if (category !== (studentData.gender === 'MALE' ? 'BOYS' : 'GIRLS')) return null;
                        
                        return (
                          <div key={category} className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">{category}</h3>
                            {items.map((item, index) => {
                              const uniformDetails = availableUniforms.find(u => u.id === item.uniformId);
                              return (
                                <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                  <h4 className="font-semibold text-gray-200">{uniformDetails?.name || 'Loading...'}</h4>
                                  <p className="text-sm text-gray-400 mt-1">{uniformDetails?.description}</p>
                                  
                                  <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs text-gray-500">Quantity</label>
                                      <p className="text-gray-200 font-medium">{item.quantityPerStudent}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500">Size</label>
                                      <select
                                        value={studentData.uniformSizes?.[`${category}-${index}`] || ''}
                                        onChange={(e) => handleSizeChange(category, index, e.target.value)}
                                        className="w-full mt-1 p-2 rounded-md bg-gray-800 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-200"
                                        required
                                      >
                                        <option value="" disabled>Select size</option>
                                        {uniformDetails?.availableSizes?.map(size => (
                                          <option key={size} value={size}>{size}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer with Navigation */}
            <div className="flex items-center justify-between p-6 bg-gray-800/50">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${step === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'}`}
                disabled={step === 1}
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-red-600 text-white hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : (step === 1 ? 'Next' : 'Save Student')}
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentModal; 