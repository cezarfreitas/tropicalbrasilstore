import { createContext, useContext, useReducer, ReactNode, useEffect } from "react";

interface CartItem {
  id: string;
  type: "grade" | "variant" | "unit";
  productId: number;
  productName: string;
  colorId?: number;
  colorName?: string;
  gradeId?: number;
  gradeName?: string;
  sizeId?: number;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  photo?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR_CART" };

const CART_STORAGE_KEY = "shopping-cart";

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function loadCartFromStorage(): CartState {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar carrinho do localStorage:", error);
  }

  return {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  };
}

function saveCartToStorage(state: CartState) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.error("Erro ao salvar carrinho no localStorage:", error);
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.item.id,
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + action.item.quantity,
          totalPrice:
            (existingItem.quantity + action.item.quantity) *
            existingItem.unitPrice,
        };

        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
          totalPrice: updatedItems.reduce(
            (sum, item) => sum + item.totalPrice,
            0,
          ),
        };
      }

      const newItems = [...state.items, action.item];
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.id);
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", id: action.id });
      }

      const updatedItems = state.items.map((item) =>
        item.id === action.id
          ? {
              ...item,
              quantity: action.quantity,
              totalPrice: action.quantity * item.unitPrice,
            }
          : item,
      );

      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0,
        ),
      };
    }

    case "CLEAR_CART":
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, loadCartFromStorage());

  useEffect(() => {
    saveCartToStorage(state);
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  const { state, dispatch } = context;

    const addItem = (item: Omit<CartItem, "id" | "totalPrice">) => {
    let id: string;

    switch (item.type) {
      case "grade":
        id = `grade-${item.productId}-${item.colorId}-${item.gradeId}`;
        break;
      case "variant":
        id = `variant-${item.productId}-${item.colorId}-${item.sizeId}`;
        break;
      case "unit":
        id = `unit-${item.productId}-${item.colorId || 'default'}`;
        break;
      default:
        id = `item-${item.productId}-${Date.now()}`;
    }
    dispatch({
      type: "ADD_ITEM",
      item: {
        ...item,
        id,
        totalPrice: item.quantity * item.unitPrice,
      },
    });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", id, quantity });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return {
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}

export type { CartItem };
