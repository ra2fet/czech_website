import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import config from '../config';
import toast from 'react-hot-toast';

// Cart item interface
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  type: 'retail' | 'wholesale' | 'offer';
  quantity: number;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  subtotal: number;
  taxFee: number;
  shippingFee: number;
  discount: number;
  total: number;
  itemCount: number;
  couponCode: string | null;
  couponId: number | null; // New field for coupon ID
  couponStatus: 'valid' | 'invalid' | 'min_cart_value' | null;
}

// Cart actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_TAX_FEE'; payload: number }
  | { type: 'SET_SHIPPING_FEE'; payload: number }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_COUPON_CODE'; payload: { code: string | null; id: number | null } }
  | { type: 'SET_COUPON_STATUS'; payload: 'valid' | 'invalid' | 'min_cart_value' | null }
  | { type: 'CLEAR_CART' }
  | { type: 'CALCULATE_TOTALS' };

// Initial state
const initialState: CartState = {
  items: [],
  subtotal: 0,
  taxFee: 0,
  shippingFee: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
  couponCode: null,
  couponId: null, // Initialize couponId
  couponStatus: null,
};

// Function to load state from localStorage
const loadState = (): CartState => {
  try {
    const serializedState = localStorage.getItem('cartState');
    if (serializedState === null) {
      return initialState;
    }
    const storedState: CartState = JSON.parse(serializedState);
    return { ...initialState, ...storedState };
  } catch (error) {
    console.error("Error loading cart state from localStorage:", error);
    return initialState;
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

// Helper function to calculate totals
const calculateTotals = (
  items: CartItem[],
  currentTaxFee: number,
  currentShippingFee: number,
  discountAmount: number
): Omit<CartState, 'items' | 'couponCode' | 'couponId' | 'couponStatus'> => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalBeforeDiscount = subtotal + currentTaxFee + currentShippingFee;
  const total = totalBeforeDiscount - discountAmount;
  return {
    subtotal,
    taxFee: currentTaxFee,
    shippingFee: currentShippingFee,
    discount: discountAmount,
    total: Math.max(0, total),
    itemCount,
  };
};

// Cart reducer function
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItem[];
  let updatedState: CartState;

  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.type === action.payload.type
      );
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          ...action.payload,
          id: `${action.payload.productId}-${action.payload.type}-${Date.now()}`,
          quantity: 1,
        };
        newItems = [...state.items, newItem];
      }
      updatedState = { ...state, items: newItems };
      break;
    }
    case 'REMOVE_ITEM': {
      newItems = state.items.filter(item => item.id !== action.payload);
      updatedState = { ...state, items: newItems };
      break;
    }
    case 'UPDATE_QUANTITY': {
      newItems = state.items
        .map(item =>
          item.id === action.payload.id ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item
        )
        .filter(item => item.quantity > 0);
      updatedState = { ...state, items: newItems };
      break;
    }
    case 'SET_TAX_FEE':
      updatedState = { ...state, taxFee: action.payload };
      break;
    case 'SET_SHIPPING_FEE':
      updatedState = { ...state, shippingFee: action.payload };
      break;
    case 'SET_DISCOUNT':
      updatedState = { ...state, discount: action.payload };
      break;
    case 'SET_COUPON_CODE':
      updatedState = { ...state, couponCode: action.payload.code, couponId: action.payload.id };
      break;
    case 'SET_COUPON_STATUS':
      updatedState = { ...state, couponStatus: action.payload };
      break;
    case 'CLEAR_CART':
      updatedState = { ...initialState, couponStatus: null, couponId: null };
      break;
    case 'CALCULATE_TOTALS':
    default:
      updatedState = state;
  }

  const calculatedTotals = calculateTotals(
    updatedState.items,
    updatedState.taxFee,
    updatedState.shippingFee,
    updatedState.discount
  );
  const finalState = { ...updatedState, ...calculatedTotals };
  saveState(finalState);
  return finalState;
};

// Create cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart context interface
interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, showAlerts?: boolean) => Promise<void>;
  removeCoupon: () => void;
  fetchAndCalculateFees: () => Promise<void>;
}

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, loadState());

  useEffect(() => {
    fetchAndCalculateFees();
  }, [state.items]);

  const applyCoupon = useCallback(
    async (code: string, showAlerts: boolean = true) => {
      if (state.couponCode === code && state.couponStatus) {
        return;
      }

      try {
        const response = await config.axios.get(`coupon-codes/${code}`);
        const coupon = response.data;

        if (coupon) {
          const currentSubtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

          if (coupon.min_cart_value && currentSubtotal < coupon.min_cart_value) {
            dispatch({ type: 'SET_COUPON_STATUS', payload: 'min_cart_value' });
            dispatch({ type: 'SET_DISCOUNT', payload: 0 });
            dispatch({ type: 'SET_COUPON_CODE', payload: { code: null, id: null } });
            // if (showAlerts) {
            //   toast.error(`Coupon requires a minimum cart value of $${Number(coupon.min_cart_value).toFixed(0)}`);
            // }
            return;
          }

          let discountAmount = 0;
          if (coupon.discount_type === 'percentage') {
            discountAmount = currentSubtotal * coupon.discount_value;
          } else if (coupon.discount_type === 'fixed') {
            discountAmount = coupon.discount_value;
          }
          dispatch({ type: 'SET_DISCOUNT', payload: discountAmount });
          dispatch({ type: 'SET_COUPON_CODE', payload: { code, id: coupon.id } }); // Store both code and ID
          dispatch({ type: 'SET_COUPON_STATUS', payload: 'valid' });
          // if (showAlerts) {
          //   toast.success(`Coupon "${code}" applied successfully!`);
          // }
        } else {
          dispatch({ type: 'SET_COUPON_STATUS', payload: 'invalid' });
          dispatch({ type: 'SET_DISCOUNT', payload: 0 });
          dispatch({ type: 'SET_COUPON_CODE', payload: { code: null, id: null } });
          // if (showAlerts) {
          //   toast.error('Invalid or expired coupon code.');
          // }
        }
      } catch (error) {
        console.error('Error applying coupon:', error);
        dispatch({ type: 'SET_COUPON_STATUS', payload: 'invalid' });
        dispatch({ type: 'SET_DISCOUNT', payload: 0 });
        dispatch({ type: 'SET_COUPON_CODE', payload: { code: null, id: null } });
        // if (showAlerts) {
        //   toast.error('Invalid or expired coupon code.');
        // }
      }
    },
    [dispatch, state.items, state.couponCode, state.couponStatus]
  );

  const fetchAndCalculateFees = useCallback(async () => {
    const currentSubtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let newTaxFee = 0;
    try {
      const taxResponse = await config.axios.get('tax-fees/active');
      if (taxResponse.data && taxResponse.data.length > 0) {
        newTaxFee = currentSubtotal * taxResponse.data[0].rate;
      }
    } catch (error) {
      console.error('Error fetching tax fees:', error);
    }
    dispatch({ type: 'SET_TAX_FEE', payload: newTaxFee });

    let newShippingFee = 0;
    try {
      const shippingResponse = await config.axios.get('shipping-rates/active');
      if (shippingResponse.data && shippingResponse.data.length > 0) {
        interface ShippingRateAPI {
          min_price: number;
          max_price: number | null;
          percentage_rate: number;
        }
        const applicableRate = shippingResponse.data.find((rate: ShippingRateAPI) =>
          currentSubtotal >= rate.min_price && (rate.max_price === null || currentSubtotal <= rate.max_price)
        );
        if (applicableRate) {
          newShippingFee = currentSubtotal * applicableRate.percentage_rate;
        }
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
    }
    dispatch({ type: 'SET_SHIPPING_FEE', payload: newShippingFee });

    if (state.couponCode && !state.couponStatus) {
      await applyCoupon(state.couponCode, false);
    } else if (!state.couponCode) {
      dispatch({ type: 'SET_DISCOUNT', payload: 0 });
    }
  }, [dispatch, state.items, state.couponCode, state.couponStatus, applyCoupon]);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'SET_DISCOUNT', payload: 0 });
    dispatch({ type: 'SET_COUPON_CODE', payload: { code: null, id: null } });
    dispatch({ type: 'SET_COUPON_STATUS', payload: null });
    toast.success('Coupon removed.');
  }, [dispatch]);

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, [dispatch]);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatch]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, [dispatch]);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  return (
    <CartContext.Provider
      value={{ state, addItem, removeItem, updateQuantity, clearCart, applyCoupon, removeCoupon, fetchAndCalculateFees }}
    >
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