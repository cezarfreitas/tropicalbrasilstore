import { useCart } from "@/hooks/use-cart";
import { AddToCartModal } from "./AddToCartModal";

export function GlobalCartModal() {
  const { isModalOpen, modalProduct, closeModal } = useCart();

  return (
    <AddToCartModal
      isOpen={isModalOpen}
      onClose={closeModal}
      product={modalProduct}
    />
  );
}
