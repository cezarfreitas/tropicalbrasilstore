export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Size {
  id: number;
  size: string;
  display_order: number;
  created_at: string;
}

export interface Color {
  id: number;
  name: string;
  hex_code?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  base_price?: number;
  sku?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface GradeVendida {
  id: number;
  name: string;
  description?: string;
  total_price?: number;
  active: boolean;
  created_at: string;
  items?: GradeItem[];
}

export interface GradeItem {
  id: number;
  grade_id: number;
  product_id: number;
  size_id: number;
  color_id: number;
  quantity: number;
  product?: Product;
  size?: Size;
  color?: Color;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateSizeRequest {
  size: string;
  display_order?: number;
}

export interface CreateColorRequest {
  name: string;
  hex_code?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category_id?: number;
  base_price?: number;
  sku?: string;
}

export interface CreateGradeRequest {
  name: string;
  description?: string;
  total_price?: number;
  items: Array<{
    product_id: number;
    size_id: number;
    color_id: number;
    quantity: number;
  }>;
}
