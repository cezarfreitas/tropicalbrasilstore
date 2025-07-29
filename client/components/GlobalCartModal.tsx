import { useCart } from "@/hooks/use-cart";
import { AddToCartModal } from "./AddToCartModal";

export function GlobalCartModal() {
  const { isModalOpen, modalProduct, closeModal } = useCart();

  console.log("🎯 GlobalCartModal render - isModalOpen:", isModalOpen, "modalProduct:", modalProduct);

  return (
    <AddToCartModal
      isOpen={isModalOpen}
      onClose={closeModal}
      product={modalProduct}
    />
  );
}
