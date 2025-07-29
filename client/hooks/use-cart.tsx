import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useCustomerAuth } from "./use-customer-auth";

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
  piecesPerGrade?: number; // Para grades: quantas peças tem cada grade
}

interface ModalProduct {
  name: string;
  photo?: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isModalOpen: boolean;
  modalProduct: ModalProduct | null;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; state: CartState }
  | { type: "SHOW_MODAL"; product: ModalProduct }
  | { type: "HIDE_MODAL" };

const CART_STORAGE_PREFIX = "shopping-cart-user-";

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function getCartStorageKey(userId?: number): string | null {
  if (!userId) return null;
  return `${CART_STORAGE_PREFIX}${userId}`;
}

function loadCartFromStorage(userId?: number): CartState {
  try {
    if (typeof window !== "undefined" && userId) {
      const storageKey = getCartStorageKey(userId);
      if (storageKey) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Add missing modal state for backwards compatibility
          return {
            ...parsed,
            isModalOpen: false,
            modalProduct: null,
          };
        }
      }
    }
  } catch (error) {
    console.error("Erro ao carregar carrinho do localStorage:", error);
  }

  return {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isModalOpen: false,
    modalProduct: null,
  };
}

function saveCartToStorage(state: CartState, userId?: number) {
  try {
    if (typeof window !== "undefined" && userId) {
      const storageKey = getCartStorageKey(userId);
      if (storageKey) {
        // Only save cart data, not modal state
        const cartData = {
          items: state.items,
          totalItems: state.totalItems,
          totalPrice: state.totalPrice,
        };
        localStorage.setItem(storageKey, JSON.stringify(cartData));
      }
    }
  } catch (error) {
    console.error("Erro ao salvar carrinho no localStorage:", error);
  }
}

function clearUserCartFromStorage(userId?: number) {
  try {
    if (typeof window !== "undefined" && userId) {
      const storageKey = getCartStorageKey(userId);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.error("Erro ao limpar carrinho do localStorage:", error);
  }
}

// Helper function to calculate total items considering pieces per grade
function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (item.type === "grade" && item.piecesPerGrade) {
      // For grades: quantity of grades × pieces per grade
      return sum + item.quantity * item.piecesPerGrade;
    } else {
      // For variants/units: just the quantity
      return sum + item.quantity;
    }
  }, 0);
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
          totalItems: calculateTotalItems(updatedItems),
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
        totalItems: calculateTotalItems(newItems),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.id);
      return {
        ...state,
        items: newItems,
        totalItems: calculateTotalItems(newItems),
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
        totalItems: calculateTotalItems(updatedItems),
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
        isModalOpen: state.isModalOpen,
        modalProduct: state.modalProduct,
      };

    case "LOAD_CART":
      return {
        ...action.state,
        totalItems: calculateTotalItems(action.state.items),
        isModalOpen: false,
        modalProduct: null,
      };

    case "SHOW_MODAL":
      return {
        ...state,
        isModalOpen: true,
        modalProduct: action.product,
      };

    case "HIDE_MODAL":
      return {
        ...state,
        isModalOpen: false,
        modalProduct: null,
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
    isModalOpen: false,
    modalProduct: null,
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
  const { customer, isAuthenticated } = useCustomerAuth();
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated && customer && !cartLoaded) {
      const storedCart = loadCartFromStorage(customer.id);
      if (storedCart.items.length > 0 || storedCart.totalItems > 0) {
        dispatch({ type: "LOAD_CART", state: storedCart });
      }
      setCartLoaded(true);
    } else if (!isAuthenticated && cartLoaded) {
      // Clear cart when user logs out
      dispatch({ type: "CLEAR_CART" });
      setCartLoaded(false);
    }
  }, [isAuthenticated, customer, cartLoaded, dispatch]);

  // Save cart to storage when cart changes (only for authenticated users)
  useEffect(() => {
    if (isAuthenticated && customer && cartLoaded) {
      saveCartToStorage(state, customer.id);
    }
  }, [state, isAuthenticated, customer, cartLoaded]);

  const addItem = (item: Omit<CartItem, "id" | "totalPrice">) => {
    // Only allow adding items if user is authenticated
    if (!isAuthenticated || !customer) {
      // Show a message or redirect to login instead of adding to cart
      console.warn(
        "Usuário deve estar logado para adicionar itens ao carrinho",
      );
      return;
    }

    let id: string;

    switch (item.type) {
      case "grade":
        id = `grade-${item.productId}-${item.colorId}-${item.gradeId}`;
        break;
      case "variant":
        id = `variant-${item.productId}-${item.colorId}-${item.sizeId}`;
        break;
      case "unit":
        id = `unit-${item.productId}-${item.colorId || "default"}`;
        break;
      default:
        id = `item-${item.productId}-${Date.now()}`;
    }

    // Add item to cart
    dispatch({
      type: "ADD_ITEM",
      item: {
        ...item,
        id,
        totalPrice: item.quantity * item.unitPrice,
      },
    });

    // Prepare modal product data
    let variant = "";
    if (item.type === "grade" && item.gradeName) {
      variant = `${item.gradeName}${item.colorName ? ` - ${item.colorName}` : ""}`;
    } else if (item.type === "variant" && (item.sizeName || item.colorName)) {
      variant = [item.colorName, item.sizeName].filter(Boolean).join(" - ");
    } else if (item.colorName) {
      variant = item.colorName;
    }

    // Show confirmation modal
    dispatch({
      type: "SHOW_MODAL",
      product: {
        name: item.productName,
        photo: item.photo,
        variant: variant || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      },
    });
  };

  const removeItem = (id: string) => {
    if (!isAuthenticated) return;
    dispatch({ type: "REMOVE_ITEM", id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!isAuthenticated) return;
    dispatch({ type: "UPDATE_QUANTITY", id, quantity });
  };

  const clearCart = () => {
    if (!isAuthenticated) return;
    dispatch({ type: "CLEAR_CART" });
    if (customer) {
      clearUserCartFromStorage(customer.id);
    }
  };

  const closeModal = () => {
    dispatch({ type: "HIDE_MODAL" });
  };

  return {
    items: isAuthenticated ? state.items : [],
    totalItems: isAuthenticated ? state.totalItems : 0,
    totalPrice: isAuthenticated ? state.totalPrice : 0,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    // Modal state and controls
    isModalOpen: state.isModalOpen,
    modalProduct: state.modalProduct,
    closeModal,
    // Authentication state
    isAuthenticated,
    requiresLogin: !isAuthenticated,
  };
}

export type { CartItem, ModalProduct };
