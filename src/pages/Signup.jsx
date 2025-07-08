import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuthStore } from '../stores/authStore';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleType, setRoleType] = useState('staff');
  const [firstUser, setFirstUser] = useState(false);
  const { setUser, saveStaffProfile, saveManagerProfile } = useAuthStore();

  // Check if this is the first user in the system
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        // Check if any managers exist
        const managersQuery = query(collection(db, 'managers'), limit(1));
        const managersSnapshot = await getDocs(managersQuery);
        
        // Check if any staff exist
        const staffQuery = query(collection(db, 'staff'), limit(1));
        const staffSnapshot = await getDocs(staffQuery);
        
        // If both collections are empty, this is the first user
        if (managersSnapshot.empty && staffSnapshot.empty) {
          setFirstUser(true);
          // Set roleType to manager automatically for first user
          setRoleType('manager');
        }
      } catch (err) {
        console.error('Error checking for first user:', err);
      }
    };
    
    checkFirstUser();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Form validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Generate a display name from first and last name
      const displayName = `${firstName} ${lastName}`;
      
      // Base user profile data
      const profileData = {
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        photoURL: user.photoURL || '',
        appSource: 'inventory-app'
      };
      
      // If this is the first user, automatically make them a manager
      if (firstUser) {
        // First user is automatically a manager without needing approval
        await saveManagerProfile(user.uid, profileData);
        setSuccessMessage('Account created as manager! Please check your email to verify your account.');
      } else if (roleType === 'staff') {
        // Regular staff registration
        await saveStaffProfile(user.uid, profileData);
        setSuccessMessage('Account created! Please check your email to verify your account.');
      } else if (roleType === 'manager') {
        // For manager role requests, save to staff collection with pending manager request
        await saveStaffProfile(user.uid, {
          ...profileData,
          pendingManagerRequest: true,
          requestDate: new Date().toISOString()
        });
        setSuccessMessage('Account created with pending manager request! An existing manager will review your request.');
      }
      
      // Set the user in the global state
      setUser(user);
      
      // Navigate to login after a delay or keep on the same page with a verification message
      setTimeout(() => {
        navigate('/login');
      }, 5000); // Redirect after 5 seconds
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : 'An error occurred during signup'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 font-[Inter]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo and Welcome Text */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 1 
            }}
            className="w-24 h-24 mx-auto mb-6 relative group"
          >
            <div className="w-full h-full bg-gradient-to-tr from-red-600 to-red-500 rounded-2xl shadow-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
              <span className="text-5xl font-black text-white font-[Inter] tracking-tighter transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
                M
              </span>
              <div className="absolute inset-0 bg-black/10 rounded-2xl group-hover:bg-black/0 transition-colors duration-500" />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 tracking-tight"
          >
            Create Account
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mt-3 text-lg"
          >
            Join Monisha Inventory Management System
          </motion.p>
          {firstUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-sm bg-red-100 text-red-600 p-2 rounded-lg inline-block"
            >
              You are the first user! You will be registered as a manager.
            </motion.div>
          )}
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-xl backdrop-blur-sm backdrop-filter bg-opacity-80"
        >
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-500 p-4 rounded-xl text-sm flex items-center font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 text-green-600 p-4 rounded-xl text-sm flex items-center font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMessage}
              </motion.div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <div className="mt-1 relative group">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your first name"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Surname</label>
              <div className="mt-1 relative group">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your surname"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="mt-1 relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="mt-1 relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="mt-1 relative group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Confirm your password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Role Selection - disabled for first user */}
            {!firstUser && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                <div className="flex space-x-4">
                  <div 
                    className={`flex-1 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      roleType === 'staff'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                    onClick={() => setRoleType('staff')}
                  >
                    <div className="font-medium">Staff</div>
                    <div className="text-sm text-gray-500 mt-1">Regular staff account</div>
                  </div>
                  <div 
                    className={`flex-1 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      roleType === 'manager'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                    onClick={() => setRoleType('manager')}
                  >
                    <div className="font-medium">Manager</div>
                    <div className="text-sm text-gray-500 mt-1">Requires approval</div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 px-4 rounded-xl font-medium text-lg shadow-lg hover:from-red-600 hover:to-red-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup; 