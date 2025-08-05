import { useEffect } from "react";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";

interface DynamicTitleProps {
  suffix?: string;
}

export function DynamicTitle({ suffix = "" }: DynamicTitleProps) {
  const storeSettings = useGlobalStoreSettings();

  useEffect(() => {
    const storeName = storeSettings?.store_name || "Chinelos Store";
    const fullTitle = suffix ? `${suffix} - ${storeName}` : storeName;
    document.title = fullTitle;
  }, [storeSettings?.store_name, suffix]);

  return null; // This component doesn't render anything
}
