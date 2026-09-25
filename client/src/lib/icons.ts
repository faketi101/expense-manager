import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconCategoryGroup {
  category: string;
  icons: string[];
}

export const ICON_GROUPS: IconCategoryGroup[] = [
  {
    category: 'Finance & Money',
    icons: [
      'Wallet',
      'Landmark',
      'Banknote',
      'CreditCard',
      'Coins',
      'PiggyBank',
      'CircleDollarSign',
      'TrendingUp',
      'TrendingDown',
      'Receipt',
      'Scale',
      'Vault',
    ],
  },
  {
    category: 'Office & Work',
    icons: [
      'Briefcase',
      'Building2',
      'Building',
      'Laptop',
      'Monitor',
      'FileText',
      'Printer',
      'Coffee',
      'Folder',
      'Calendar',
      'Mail',
      'Phone',
      'Presentation',
      'HardDrive',
    ],
  },
  {
    category: 'Food & Groceries',
    icons: [
      'Utensils',
      'Coffee',
      'ShoppingBag',
      'ShoppingCart',
      'Pizza',
      'Apple',
      'Wine',
      'Fish',
      'Cake',
      'Beef',
    ],
  },
  {
    category: 'Daily Living & Bills',
    icons: [
      'Home',
      'User',
      'Users',
      'Zap',
      'Droplets',
      'Wifi',
      'Tv',
      'Flame',
      'Bed',
      'Brush',
      'Trash2',
    ],
  },
  {
    category: 'Transport & Travel',
    icons: [
      'Car',
      'Bus',
      'Train',
      'Plane',
      'Fuel',
      'Bike',
      'Truck',
      'Navigation',
      'Ship',
      'Compass',
    ],
  },
  {
    category: 'Tech, Hobby & Fun',
    icons: [
      'Smartphone',
      'Code',
      'Gamepad2',
      'Film',
      'Music',
      'Headphones',
      'Camera',
      'BookOpen',
      'Globe',
      'Cpu',
    ],
  },
  {
    category: 'Health, Wellness & More',
    icons: [
      'HeartPulse',
      'Activity',
      'Pill',
      'Dumbbell',
      'Scissors',
      'Shirt',
      'Watch',
      'Glasses',
      'Baby',
      'Gift',
      'Tag',
      'CircleEllipsis',
    ],
  },
];

export const ALL_ICONS: string[] = Array.from(
  new Set(ICON_GROUPS.flatMap((group) => group.icons))
);

export const getIconComponent = (iconName: string): React.ComponentType<{ className?: string; size?: number; color?: string }> => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Tag;
  return IconComponent;
};
