import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const storedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      if (products) {
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(products),
        );
      }
    }
    saveProducts();
  }, [products]);

  const increment = useCallback(
    id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0) {
        const product = products[productIndex];
        product.quantity += 1;
        const updatedProducts = [...products];
        updatedProducts.splice(productIndex, 1, product);
        setProducts(updatedProducts);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    product => {
      const productExists = products.find(p => p.id === product.id);

      if (!productExists) {
        product.quantity = 1;
        setProducts([...products, product]);
      } else increment(product.id);
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0) {
        const product = products[productIndex];
        if (product.quantity > 1) {
          product.quantity -= 1;
          const updatedProducts = [...products];
          updatedProducts.splice(productIndex, 1, product);
          return setProducts(updatedProducts);
        }
        const updatedProducts = [...products];
        updatedProducts.splice(productIndex, 1);
        setProducts(updatedProducts);
      }
      return products;
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
