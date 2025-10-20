import { create } from 'zustand';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { signOut, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc, limit } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = 'tinashegomo96@gmail.com';

export const useAuthStore = create((set, get) => ({
  user: null,
  userRole: null,
  userProfile: null,
  error: null,
  loading: false,
  isFirstUserRegistration: false,
  
  // Check if current user is super admin
  isSuperAdmin: () => {
    const state = get();
    return state.user?.email === SUPER_ADMIN_EMAIL;
  },
  
  // Initialize by checking if this is the first user
  initializeFirstUserCheck: async () => {
    try {
      // Check if any managers exist
      const managersQuery = query(collection(db, 'inventory_managers'), limit(1));
      const managersSnapshot = await getDocs(managersQuery);
      
      // Check if any staff exist
      const staffQuery = query(collection(db, 'inventory_staff'), limit(1));
      const staffSnapshot = await getDocs(staffQuery);
      
      // If both collections are empty, this is the first user
      const isFirstUser = managersSnapshot.empty && staffSnapshot.empty;
      set({ isFirstUserRegistration: isFirstUser });
      return isFirstUser;
    } catch (error) {
      console.error('Error checking for first user:', error);
      return false;
    }
  },
  
  setUser: (user) => set({ user, error: null }),
  
  clearError: () => set({ error: null }),
  
  // Save user role and profile information
  setUserRole: (role) => set({ userRole: role }),
  
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  // Create or update staff profile in Firestore
  saveStaffProfile: async (uid, profileData) => {
    try {
      console.log('🔍 AuthStore: saveStaffProfile called', { uid, profileData });
      set({ loading: true });
      const currentProfile = get().userProfile || {};
      const updatedProfile = { 
        ...currentProfile, 
        ...profileData, 
        role: 'staff', 
        appOrigin: 'inventory',
        updatedAt: new Date().toISOString() 
      };
      
      console.log('🔍 AuthStore: Saving to inventory_staff collection:', updatedProfile);
      await setDoc(doc(db, 'inventory_staff', uid), updatedProfile, { merge: true });
      console.log('🔍 AuthStore: Successfully saved to Firebase');
      
      set({ 
        userProfile: updatedProfile,
        userRole: 'staff',
        loading: false 
      });
      console.log('🔍 AuthStore: Updated store state');
      return true;
    } catch (error) {
      console.error('🔍 AuthStore: Error saving staff profile:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  // Create or update manager profile in Firestore (for admin use)
  saveManagerProfile: async (uid, profileData) => {
    try {
      console.log('🔍 AuthStore: saveManagerProfile called', { uid, profileData });
      set({ loading: true });
      const currentProfile = get().userProfile || {};
      const updatedProfile = { 
        ...currentProfile, 
        ...profileData, 
        role: 'manager', 
        appOrigin: 'inventory',
        updatedAt: new Date().toISOString() 
      };

      console.log('🔍 AuthStore: Saving to inventory_managers collection:', updatedProfile);
      await setDoc(doc(db, 'inventory_managers', uid), updatedProfile, { merge: true });
      console.log('🔍 AuthStore: Successfully saved to Firebase');
      
      set({ 
        userProfile: updatedProfile,
        userRole: 'manager',
        loading: false 
      });
      console.log('🔍 AuthStore: Updated store state');
      return true;
    } catch (error) {
      console.error('🔍 AuthStore: Error saving manager profile:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  // Fetch user profile from both collections
  fetchUserProfile: async (uid) => {
    console.log('🔍 AuthStore: fetchUserProfile called with uid:', uid);
    if (!uid) {
      console.log('🔍 AuthStore: No UID provided, clearing profile');
      set({ userProfile: null, userRole: null });
      return;
    }
    
    try {
      console.log('🔍 AuthStore: Checking inventory_managers collection');
      let userDoc = await getDoc(doc(db, 'inventory_managers', uid));
      let role = 'manager';
      
      if (!userDoc.exists()) {
        console.log('🔍 AuthStore: Not found in managers, checking inventory_staff');
        userDoc = await getDoc(doc(db, 'inventory_staff', uid));
        role = 'staff';
      }
      
      if (userDoc.exists()) {
        const profile = userDoc.data();
        console.log('🔍 AuthStore: Found profile data:', profile);
        console.log('🔍 AuthStore: Profile role:', role);
        
        // Check for app-specific identifier
        if (profile.appOrigin !== 'inventory') {
          console.log('🔍 AuthStore: User not authorized - wrong app origin:', profile.appOrigin);
          set({ userProfile: null, userRole: null, error: 'User is not authorized for this application.' });
          return;
        }

        console.log('🔍 AuthStore: Setting profile in store:', { profile, role });
        set({ userProfile: profile, userRole: role });
      } else {
        console.log('🔍 AuthStore: No profile found in either collection');
        set({ userProfile: null, userRole: null });
      }
    } catch (error) {
      console.error('🔍 AuthStore: Error fetching user profile:', error);
      set({ error: 'Failed to fetch user profile.' });
    }
  },
  
  // Get staff with pending manager requests
  getStaffWithPendingManagerRequests: async () => {
    try {
      set({ loading: true });
      const pendingRequestsQuery = query(
        collection(db, 'inventory_staff'), 
        where('pendingManagerRequest', '==', true)
      );
      const pendingSnapshot = await getDocs(pendingRequestsQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));
      set({ loading: false });
      return pendingData;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Get all staff
  getAllStaff: async () => {
    try {
      set({ loading: true });
      const staffSnapshot = await getDocs(collection(db, 'inventory_staff'));
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));
      set({ loading: false });
      return staffData;
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Get all managers
  getAllManagers: async () => {
    try {
      set({ loading: true });
      const managersSnapshot = await getDocs(collection(db, 'inventory_managers'));
      const managersData = managersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'manager'
      }));
      set({ loading: false });
      return managersData;
    } catch (error) {
      console.error('Error fetching managers:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Check if user is a manager
  isManager: () => {
    const state = get();
    return state.userRole === 'manager' || state.user?.email === SUPER_ADMIN_EMAIL;
  },
  
  // Check if user is staff
  isStaff: () => {
    const state = get();
    return state.userRole === 'staff' && state.user?.email !== SUPER_ADMIN_EMAIL;
  },
  
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, userRole: null, userProfile: null, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Delete a user from Firebase Auth and Firestore
  // Update user profile
  updateProfile: async (profileData) => {
    const state = get();
    const uid = state.user?.uid;
    const role = state.userRole;
    
    if (!uid || !role) {
      throw new Error('User not authenticated or role not found');
    }

    try {
      set({ loading: true });
      const currentProfile = state.userProfile || {};
      const updatedProfile = { 
        ...currentProfile, 
        ...profileData, 
        role: role,
        updatedAt: new Date().toISOString() 
      };
      
      const collection = role === 'manager' ? 'inventory_managers' : 'inventory_staff';
      await setDoc(doc(db, collection, uid), updatedProfile, { merge: true });
      
      set({ 
        userProfile: updatedProfile,
        loading: false 
      });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteUser: async (uid) => {
    const state = get();
    if (!state.isManager() && !state.isSuperAdmin()) {
      throw new Error("You don't have permission to delete users.");
    }

    try {
      set({ loading: true });
      
      // It's important to have a backend function to delete users to avoid needing admin privileges on the client.
      // For this example, we assume an admin context or a specific cloud function is called.
      // The below line is a placeholder for a secure backend call.
      // await deleteUser(auth, uid); // This requires admin privileges, not suitable for direct client-side code.

      // Delete from 'managers' or 'staff'
      let userRef = doc(db, 'inventory_managers', uid);
      let userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await deleteDoc(userRef);
      } else {
        userRef = doc(db, 'inventory_staff', uid);
        await deleteDoc(userRef);
      }
      
      set({ loading: false });
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
})); 