import { useCart } from "@/hooks/use-cart";
import { AddToCartModal } from "./AddToCartModal";
import { useState } from "react";
import { Button } from "./ui/button";

export function GlobalCartModal() {
  const { isModalOpen, modalProduct, closeModal } = useCart();
  const [testModalOpen, setTestModalOpen] = useState(false);

  console.log("GlobalCartModal render - isModalOpen:", isModalOpen, "modalProduct:", modalProduct);

  const testProduct = {
    name: "Produto Teste",
    photo: undefined,
    variant: "Cor Teste",
    quantity: 1,
    unitPrice: 29.99,
  };

  return (
    <>
      {/* Test button - temporary */}
      <Button
        onClick={() => setTestModalOpen(true)}
        style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}
        className="bg-red-500 hover:bg-red-600"
      >
        Teste Modal
      </Button>

      <AddToCartModal
        isOpen={isModalOpen}
        onClose={closeModal}
        product={modalProduct}
      />

      <AddToCartModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        product={testProduct}
      />
    </>
  );
}
