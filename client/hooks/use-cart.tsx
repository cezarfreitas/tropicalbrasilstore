import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react";

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
  | { type: "LOAD_CART"; state: CartState };

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

    case "LOAD_CART":
      return action.state;

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

  useEffect(() => {
    const storedCart = loadCartFromStorage();
    if (storedCart.items.length > 0 || storedCart.totalItems > 0) {
      dispatch({ type: "LOAD_CART", state: storedCart });
    }
  }, []);

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

  // Modal state for add to cart confirmation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<ModalProduct | null>(null);

  const addItem = (item: Omit<CartItem, "id" | "totalPrice">) => {
    console.log("🛒 useCart addItem called with:", item);

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

    console.log("🛒 Generated item id:", id);

    // Add item to cart
    dispatch({
      type: "ADD_ITEM",
      item: {
        ...item,
        id,
        totalPrice: item.quantity * item.unitPrice,
      },
    });

    console.log("🛒 Item dispatched to cart");

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
    const modalData = {
      name: item.productName,
      photo: item.photo,
      variant: variant || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    };

    console.log("🛒 Setting modal product:", modalData);
    console.log("🛒 Current isModalOpen before setting:", isModalOpen);

    setModalProduct(modalData);
    setIsModalOpen(true);

    console.log("🛒 Modal state should now be open");
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

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return {
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    // Modal state and controls
    isModalOpen,
    modalProduct,
    closeModal,
  };
}

export type { CartItem, ModalProduct };
