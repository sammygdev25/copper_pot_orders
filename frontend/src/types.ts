/**
 * Auto-generated TypeScript types and Zod schemas from ProjectContract.
 * Model interfaces match the Django backend exactly.
 */
import { z } from 'zod';

// DRF returns a related object either as its pk or nested; parse both to the pk
// so the parsed type matches the number typed FK fields on the interfaces.
const zRelation = z.union([z.coerce.number().int(), z.object({ id: z.coerce.number().int() }).passthrough()]).transform((v) => (typeof v === 'number' ? v : v.id));

// ── Category ──
export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export const CategorySchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
}).passthrough();

// ── MenuItem ──
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export const MenuItemSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  description: z.string(),
  price: z.coerce.number(),
  category: zRelation,
  image: z.string().nullable().nullable(),
  is_available: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Order ──
export interface Order {
  id: number;
  user: number;
  order_type: string;
  status: string;
  customer_name: string;
  phone: string;
  address: string;
  total_amount: number;
  delivery_fee: number;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  stripe_session_id: string | null;
}

export const OrderSchema = z.object({
  id: z.coerce.number(),
  user: zRelation,
  order_type: z.string(),
  status: z.string(),
  customer_name: z.string(),
  phone: z.string(),
  address: z.string(),
  total_amount: z.coerce.number(),
  delivery_fee: z.coerce.number(),
  created_at: z.string(),
  updated_at: z.string(),
  paid_at: z.string().nullable(),
  stripe_session_id: z.string().nullable(),
}).passthrough();

// ── OrderItem ──
export interface OrderItem {
  id: number;
  order: number;
  menu_item: number;
  quantity: number;
  price: number;
  created_at: string;
}

export const OrderItemSchema = z.object({
  id: z.coerce.number(),
  order: zRelation,
  menu_item: zRelation,
  quantity: z.coerce.number().int().nonnegative(),
  price: z.coerce.number(),
  created_at: z.string(),
}).passthrough();

// ── Paginated Response ──
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    count: z.coerce.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });

