import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useAuthStore } from '../stores/authStore';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuthStore();

  useEffect(() => {
    // Check if user is superuser, if not redirect
    if (!isSuperAdmin()) {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [navigate, isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch managers
      const managersSnapshot = await getDocs(collection(db, 'inventory_managers'));
      const managersData = managersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'manager'
      }));

      // Fetch staff
      const staffSnapshot = await getDocs(collection(db, 'inventory_staff'));
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));

      // Combine both sets of users
      const allUsers = [...managersData, ...staffData];
      
      // Sort by creation date
      allUsers.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setUsers(allUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId) => {
    try {
      setLoading(true);
      
      // Get user data from staff collection
      const staffDoc = await getDoc(doc(db, 'inventory_staff', userId));
      
      if (!staffDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = staffDoc.data();
      
      // Create a new manager document with the same data
      await setDoc(doc(db, 'inventory_managers', userId), {
        ...userData,
        role: 'manager',
        promotedAt: new Date().toISOString(),
        promotedBy: auth.currentUser.email
      });
      
      // Delete the staff document
      await deleteDoc(doc(db, 'inventory_staff', userId));
      
      // Refresh the user list
      await fetchUsers();
      
      setConfirmPromote(null);
    } catch (err) {
      console.error('Error promoting user:', err);
      setError('Failed to promote user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      
      // Find the user
      const userToDelete = users.find(user => user.id === userId);
      
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Delete from the appropriate collection
      if (userToDelete.role === 'manager') {
        await deleteDoc(doc(db, 'inventory_managers', userId));
      } else {
        await deleteDoc(doc(db, 'inventory_staff', userId));
      }
      
      // Refresh the user list
      await fetchUsers();
      
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchString = searchTerm.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchString) ||
      user.email?.toLowerCase().includes(searchString) ||
      user.firstName?.toLowerCase().includes(searchString) ||
      user.lastName?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white w-64"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Verified</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-300">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-t-transparent border-red-500 rounded-full animate-spin mr-2"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-300">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full" />
                          ) : (
                            <span className="text-lg font-medium text-white">
                              {user.firstName?.[0] || user.displayName?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.displayName}</div>
                          <div className="text-sm text-gray-400">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email === 'tinashegomo96@gmail.com' ? (
                        <span className="flex items-center">
                          {user.email}
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-900 text-yellow-200">
                            Super Admin
                          </span>
                        </span>
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'manager' ? 'bg-blue-900 text-blue-200' : 'bg-gray-600 text-gray-200'
                      }`}>
                        {user.role === 'manager' ? 'Manager' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.emailVerified ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.email !== 'tinashegomo96@gmail.com' && (
                        <div className="flex justify-end space-x-2">
                          {user.role === 'staff' && (
                            <button
                              onClick={() => setConfirmPromote(user)}
                              className="text-blue-400 hover:text-blue-300 bg-blue-900/30 px-2 py-1 rounded"
                            >
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(user)}
                            className="text-red-400 hover:text-red-300 bg-red-900/30 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for User Deletion */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm User Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{confirmDelete.displayName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for User Promotion */}
      {confirmPromote && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm User Promotion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to promote <span className="font-semibold text-white">{confirmPromote.displayName}</span> to Manager?
              This will give them additional privileges.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmPromote(null)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePromoteUser(confirmPromote.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Promote to Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 