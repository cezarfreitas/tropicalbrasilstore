import { createContext, useContext, useReducer, ReactNode } from "react";

interface CartItem {
  id: string;
  type: "grade";
  productId: number;
  productName: string;
  colorId: number;
  colorName: string;
  gradeId: number;
  gradeName: string;
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

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

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
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });

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
    const id = `grade-${item.productId}-${item.colorId}-${item.gradeId}`;
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
