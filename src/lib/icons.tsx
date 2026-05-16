import React from 'react';
import { 
  ShoppingCart, CarFront, ShoppingBag, Coffee, ReceiptText, Zap, 
  Utensils, Heart, Sparkles, LayoutGrid, Target, Home, Plane, 
  Bike, Gamepad2, Trophy, Gift, Laptop, Smartphone, Gem, Sofa, 
  Construction, ShieldCheck, Clock
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  'shopping-cart': ShoppingCart,
  'car': CarFront,
  'shopping-bag': ShoppingBag,
  'coffee': Coffee,
  'receipt': ReceiptText,
  'zap': Zap,
  'utensils': Utensils,
  'heart': Heart,
  'sparkles': Sparkles,
  'layout-grid': LayoutGrid,
  'target': Target,
  'home': Home,
  'plane': Plane,
  'bike': Bike,
  'gamepad': Gamepad2,
  'trophy': Trophy,
  'gift': Gift,
  'laptop': Laptop,
  'smartphone': Smartphone,
  'gem': Gem,
  'sofa': Sofa,
  'construction': Construction,
  'shield-check': ShieldCheck,
  'clock': Clock,
};

export const getIconById = (id: string, fallback: React.ElementType = LayoutGrid) => {
  return ICON_MAP[id] || fallback;
};
