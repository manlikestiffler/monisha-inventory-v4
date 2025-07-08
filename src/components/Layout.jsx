import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from './ThemeProvider';
import Logo from '../components/Logo';
import MobileMenu from './navigation/MobileMenu';
import {
  DashboardIcon,
  InventoryIcon,
  ManufacturingIcon,
  OrdersIcon,
  SchoolsIcon,
  ReportsIcon,
  NotificationIcon,
  MenuIcon
} from './icons';
import { FiUsers, FiUser, FiSettings, FiLogOut, FiTrash2, FiShield, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';

const Layout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isManager, userProfile, userRole, deleteAccount } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Get user's full name
  const getUserFullName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    
    return 'User';
  };

  // Get initials from user information
  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/inventory', label: 'Inventory', icon: <InventoryIcon /> },
    { path: '/batches', label: 'Batch Inventory', icon: <ManufacturingIcon /> },
    { path: '/orders', label: 'Orders', icon: <OrdersIcon /> },
    { path: '/schools', label: 'Schools', icon: <SchoolsIcon /> },
    { path: '/reports', label: 'Reports', icon: <ReportsIcon /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          isScrolled ? 'bg-background/80 backdrop-blur-sm shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <Logo />
              </Link>

              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      location.pathname.startsWith(link.path)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none"
                title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              >
                <span className="sr-only">Toggle theme</span>
                {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
              </button>

              <button className="p-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none">
                <span className="sr-only">View notifications</span>
                <NotificationIcon />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-sm focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                    <span className="text-primary font-medium">
                        {getUserInitials()}
                    </span>
                    )}
                  </div>
                  <FiChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lg bg-card ring-1 ring-border"
                    >
                      {/* User Info Section */}
                      <div className="px-4 py-5">
                        <div className="flex items-center">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {userProfile?.photoURL ? (
                              <img 
                                src={userProfile.photoURL} 
                                alt="Profile" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                            <span className="text-2xl text-primary font-medium">
                                {getUserInitials()}
                            </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-base font-bold text-foreground">
                              {getUserFullName()}
                            </p>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center mt-4 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          userRole === 'manager' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          <FiShield className="inline-block mr-1.5" />
                          {userRole === 'manager' ? 'Manager' : 'Staff'}
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <hr className="border-border" />
                      
                      {/* Actions Section */}
                      <div className="py-2">
                        <DropdownMenuItem onSelect={() => { navigate('/profile'); setIsProfileOpen(false); }}>
                          <FiUser className="mr-3" />
                          <span>View Profile</span>
                        </DropdownMenuItem>
                        {isManager() && (
                          <DropdownMenuItem onSelect={() => { navigate('/users'); setIsProfileOpen(false); }}>
                            <FiUsers className="mr-3" />
                            <span>User Management</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => { navigate('/settings'); setIsProfileOpen(false); }}>
                          <FiSettings className="mr-3" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                      </div>

                      {/* Divider */}
                      <hr className="border-border" />

                      {/* Logout Section */}
                      <div className="py-2">
                        <DropdownMenuItem onSelect={handleLogout}>
                          <FiLogOut className="mr-3" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none md:hidden"
              >
                <span className="sr-only">Open main menu</span>
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu 
            navLinks={navLinks} 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
          />
        )}
      </AnimatePresence>

      <main className="pt-16 bg-background">
        {children}
      </main>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md p-8"
            >
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <FiTrash2 className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">
                  Delete Account
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete your account? All of your data will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownMenuItem = ({ onSelect, children }) => (
  <button
    onClick={onSelect}
    className="w-full flex items-center px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
  >
    {children}
  </button>
);

DropdownMenuItem.propTypes = {
  onSelect: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;