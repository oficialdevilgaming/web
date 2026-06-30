export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category_id: string; // UUID from Supabase
  category?: {
    name: string;
    parent_id?: string | null;
    parent?: { name: string };
  }; // For joins
  price: number;
  discountPrice?: number;
  discount?: number; // Numeric field for discount percentage
  description: string;
  images?: string[];
  stock: number;
  featured: boolean;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface Order {
  id: string;
  userId?: string;
  customer_name: string;
  email?: string;
  phone: string;
  date?: string;
  items: CartItem[];
  total: number;
  status: 'Pendiente' | 'Pagado' | 'Enviado' | 'Entregado' | 'Cancelado';
}
