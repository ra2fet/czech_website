import { createContext, useContext, useReducer, ReactNode } from 'react';

// Cart item interface
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  type: 'retail' | 'wholesale';
  quantity: number;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// Cart context interface
interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

// Function to load state from localStorage
const loadState = (): CartState => {
  try {
    const serializedState = localStorage.getItem('cartState');
    if (serializedState === null) {
      return { items: [], total: 0, itemCount: 0 };
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Error loading cart state from localStorage:", error);
    return { items: [], total: 0, itemCount: 0 };
  }
};

// Function to save state to localStorage
const saveState = (state: CartState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('cartState', serializedState);
  } catch (error) {
    console.error("Error saving cart state to localStorage:", error);
  }
};

// Cart reducer function
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.type === action.payload.type
      );

      let newItems;
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          ...action.payload,
          id: `${action.payload.productId}-${action.payload.type}-${Date.now()}`,
          quantity: 1,
        };
        newItems = [...state.items, newItem];
      }

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      newState = { items: newItems, total, itemCount };
      break;
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      newState = { items: newItems, total, itemCount };
      break;
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      newState = { items: newItems, total, itemCount };
      break;
    }

    case 'CLEAR_CART':
      newState = { items: [], total: 0, itemCount: 0 }; // Clear to empty, not initial state from localStorage
      break;

    default:
      newState = state;
  }
  saveState(newState); // Save state to localStorage after every action
  return newState;
};

// Create cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, loadState()); // Load initial state from localStorage

  const addItem = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
