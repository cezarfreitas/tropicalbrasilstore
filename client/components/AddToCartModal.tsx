import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { ShoppingCart, ArrowRight, Package } from "lucide-react";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    photo?: string;
    variant?: string; // Color + Size or Grade name
    quantity: number;
    unitPrice: number;
  } | null;
}

export function AddToCartModal({ isOpen, onClose, product }: AddToCartModalProps) {
  const navigate = useNavigate();

  console.log("AddToCartModal render - isOpen:", isOpen, "product:", product);

  const handleContinueShopping = () => {
    onClose();
  };

  const handleGoToCheckout = () => {
    onClose();
    navigate("/loja/checkout");
  };

  const handleGoToCart = () => {
    onClose();
    navigate("/loja/carrinho");
  };

  if (!product) return null;

  const totalPrice = product.unitPrice * product.quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <ShoppingCart className="h-5 w-5" />
            Item Adicionado ao Carrinho!
          </DialogTitle>
          <DialogDescription>
            Seu produto foi adicionado com sucesso
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-4 py-4">
          {/* Product Image */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {product.photo ? (
              <ProductImage
                src={product.photo}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            {product.variant && (
              <p className="text-xs text-gray-600 mt-1">
                {product.variant}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">
                Quantidade: {product.quantity}
              </span>
              <span className="font-bold text-green-600">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="flex-1"
          >
            Continuar Comprando
          </Button>
          <div className="flex gap-2 flex-1">
            <Button
              onClick={handleGoToCart}
              variant="secondary"
              className="flex-1"
            >
              Ver Carrinho
            </Button>
            <Button
              onClick={handleGoToCheckout}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Finalizar
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
