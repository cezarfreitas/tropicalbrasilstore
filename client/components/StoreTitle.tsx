import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";

interface StoreTitleProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
}

export function StoreTitle({
  className = "",
  size = "lg",
  showSubtitle = false,
}: StoreTitleProps) {
  const storeSettings = useGlobalStoreSettings();

  const storeName =
    storeSettings?.store_name ||
    (typeof window !== "undefined" && window.__STORE_SETTINGS__?.store_name) ||
    "Tropical Brasil Sandálias";

  const sizeClasses = {
    sm: "text-lg font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
    xl: "text-3xl font-bold",
  };

  return (
    <div className={`text-center ${className}`}>
      <h1 className={`text-primary ${sizeClasses[size]} tracking-tight`}>
        {storeName}
      </h1>
      {showSubtitle && (
        <p className="text-muted-foreground text-sm mt-1">
          Calçados de qualidade para toda a família
        </p>
      )}
    </div>
  );
}
