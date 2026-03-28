import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackEvent } from '@/lib/track-event';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  slug: string;
  quantity: number;
  stock: number;
  size?: string; // Selected size (S, M, L, XL, XXL)
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

// Unique key for cart item: id + size
const cartKey = (id: string, size?: string) => size ? `${id}__${size}` : id;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === item.id && (i.size || '') === (item.size || '')
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && (i.size || '') === (item.size || '')
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      removeItem: (id, size) => {
        const removed = get().items.find(i => i.id === id && (i.size || '') === (size || ''));
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.id === id && (i.size || '') === (size || ''))
          ),
        }));
        if (removed) {
          trackEvent({
            event_type: 'remove_from_cart',
            product_id: removed.id,
            product_title: removed.title,
            product_price: removed.price,
            product_size: removed.size,
            quantity: removed.quantity,
          });
        }
      },
      updateQuantity: (id, quantity, size) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && (i.size || '') === (size || '')
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
              : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'luriva-cart' }
  )
);
