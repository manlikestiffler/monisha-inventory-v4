import { create } from 'zustand';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useInventoryStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    try {
      set({ loading: true, error: null });
      
      // Fetch uniforms
      const uniformsQuery = query(collection(db, 'uniforms'), orderBy('createdAt', 'desc'));
      const uniformsSnapshot = await getDocs(uniformsQuery);
      const uniformsData = await Promise.all(uniformsSnapshot.docs.map(async (doc) => {
        const uniform = { id: doc.id, ...doc.data() };
        // Fetch variants for each uniform
        const variantsQuery = query(collection(db, 'uniform_variants'));
        const variantsSnapshot = await getDocs(variantsQuery);
        const variants = variantsSnapshot.docs
          .filter(variant => variant.data().uniformId === doc.id)
          .map(variant => ({ id: variant.id, ...variant.data() }));
        return { ...uniform, variants };
      }));

      // Fetch raw materials
      const materialsQuery = query(collection(db, 'raw_materials'), orderBy('createdAt', 'desc'));
      const materialsSnapshot = await getDocs(materialsQuery);
      const materialsData = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        variants: [] // Raw materials don't have variants
      }));

      set({ products: [...uniformsData, ...materialsData], loading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  addProduct: async (productData, type) => {
    try {
      set({ loading: true, error: null });
      
      if (type === 'uniform') {
        // Add uniform
        const uniformRef = await addDoc(collection(db, 'uniforms'), {
          ...productData,
          type: 'uniform',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Add variants
        const variantPromises = productData.variants.map(variant =>
          addDoc(collection(db, 'uniform_variants'), {
            uniformId: uniformRef.id,
            ...variant,
            createdAt: new Date()
          })
        );

        await Promise.all(variantPromises);
      } else {
        // Add raw material
        await addDoc(collection(db, 'raw_materials'), {
          ...productData,
          type: 'raw_material',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await get().fetchProducts(); // Refresh the products list
      set({ loading: false });
    } catch (error) {
      console.error('Error adding product:', error);
      set({ error: 'Failed to add product', loading: false });
    }
  },

  deleteProduct: async (productId, isRawMaterial) => {
    try {
      set({ loading: true, error: null });
      
      if (!isRawMaterial) {
        // Delete from uniforms collection
        await deleteDoc(doc(db, 'uniforms', productId));
      } else {
        // Delete from raw_materials collection
        await deleteDoc(doc(db, 'raw_materials', productId));
      }

      set(state => ({
        products: state.products.filter(p => p.id !== productId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting product:', error);
      set({ error: 'Failed to delete product', loading: false });
      throw error; // Re-throw the error to be handled by the component
    }
  }
})); 