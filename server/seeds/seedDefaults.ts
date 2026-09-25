import { BaseType } from '../models/BaseType.js';
import { Source } from '../models/Source.js';
import { Category } from '../models/Category.js';

export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  'Food & Dining': [
    'Restaurant & Dining',
    'Fast Food',
    'Cafe & Coffee',
    'Street Food',
    'Snacks & Beverages',
    'Food Delivery',
    'Lunch & Dinner',
  ],
  'Groceries': [
    'Supermarket & Bazaar',
    'Vegetables & Fruits',
    'Meat, Fish & Eggs',
    'Dairy & Bakery',
    'Rice, Oil & Staples',
    'Household & Cleaning',
  ],
  'Transport & Fuel': [
    'Fuel / Petrol / Octane',
    'Ride Share (Uber/Pathao)',
    'Rickshaw & Auto',
    'Public Bus',
    'Metro & Train',
    'Parking & Toll',
    'Vehicle Maintenance',
  ],
  'Utilities & Bills': [
    'Electricity Bill',
    'Gas & Cylinder',
    'Water & Sewerage',
    'Internet & Wi-Fi',
    'Mobile Recharge',
    'TV & Cable',
  ],
  'Rent & Housing': [
    'House Rent',
    'Service & Maintenance Charge',
    'Furniture & Home Decor',
    'Home Repair & Hardware',
  ],
  'Healthcare': [
    'Doctor Consultation',
    'Pharmacy & Medicines',
    'Diagnostic & Lab Tests',
    'Dental & Eye Care',
    'Hospital & Clinic',
  ],
  'Entertainment': [
    'Movies & Cinema',
    'Streaming (Netflix/Spotify)',
    'Gaming & Arcades',
    'Travel & Day Out',
    'Books & Hobbies',
  ],
  'Office Supplies': [
    'Stationery & Pens',
    'Printer Paper',
    'Toners & Cartridges',
    'Desk Accessories',
    'Courier & Shipping',
  ],
  'Team Lunch & Coffee': [
    'Team Lunch',
    'Daily Tea & Coffee',
    'Office Snacks',
    'Team Dinner',
  ],
  'Software & Subscriptions': [
    'Cloud & Hosting (AWS/Vercel)',
    'SaaS Tools (Slack/Jira)',
    'Domains & SSL',
    'Software Licenses',
  ],
  'Office Rent & Maintenance': [
    'Office Rent',
    'Facility Maintenance',
    'Cleaning & Janitorial',
    'Office Electricity',
  ],
  'Internet & Tech': [
    'Office Broadband / ISP',
    'Tech Hardware & Peripherals',
    'Cables & Adapters',
    'IT Repairs & Maintenance',
  ],
  'Miscellaneous': [
    'Personal Care & Grooming',
    'Gifts & Celebrations',
    'Laundry & Cleaning',
    'Emergency & Unplanned',
  ],
  'Prayers & Donations': [
    'Zakat',
    'Sadaqah & Charity',
    'Mosque / Religious',
    'Disaster & Community Relief',
  ],
  'Refund': [
    'Product Return Refund',
    'Order Cancellation Refund',
    'Overcharge Refund',
  ],
  'Salary': [
    'Monthly Salary',
    'Festival Bonus',
    'Overtime Pay',
  ],
  'Business Revenue': [
    'Client Invoicing',
    'Product Sales',
    'Consulting Services',
  ],
  'Freelance & Bonus': [
    'Freelance Project',
    'Performance Bonus',
    'Commission & Tips',
  ],
  'Other Income': [
    'Bank Profit / Interest',
    'Cashback & Rewards',
    'Investment Return',
    'Gift Received',
  ],
};

const mapSubcategories = (catName: string, icon: string, color: string) => {
  const subs = DEFAULT_SUBCATEGORIES[catName] || [];
  return subs.map((name) => ({
    name,
    icon,
    color,
  }));
};

export const seedDefaultsIfEmpty = async () => {
  try {
    const baseTypeCount = await BaseType.countDocuments();
    let personalType = null;
    let officeType = null;

    if (baseTypeCount === 0) {
      console.log('Seeding initial Base Types...');
      personalType = await BaseType.create({
        name: 'Personal',
        icon: 'User',
        color: '#3b82f6',
        description: 'Personal daily living, family, and home expenses',
        order: 0,
        isDefault: true,
      });

      officeType = await BaseType.create({
        name: 'Office',
        icon: 'Briefcase',
        color: '#f59e0b',
        description: 'Office management, business operations, and team expenses',
        order: 1,
        isDefault: false,
      });
      console.log('Base Types seeded successfully.');
    } else {
      personalType = await BaseType.findOne({ name: 'Personal' });
      officeType = await BaseType.findOne({ name: 'Office' });
    }

    const sourceCount = await Source.countDocuments();
    if (sourceCount === 0) {
      console.log('Seeding initial Sources...');
      await Source.insertMany([
        {
          name: 'Cash',
          type: 'cash',
          icon: 'Banknote',
          color: '#10b981',
          initialBalance: 0,
          accountNumber: 'Physical',
          order: 0,
          isActive: true,
        },
        {
          name: 'Bank Account',
          type: 'bank',
          icon: 'Landmark',
          color: '#0ea5e9',
          initialBalance: 0,
          accountNumber: 'Primary',
          order: 1,
          isActive: true,
        },
        {
          name: 'Mobile Banking',
          type: 'mobile_banking',
          icon: 'Smartphone',
          color: '#ec4899',
          initialBalance: 0,
          accountNumber: 'bKash / Nagad',
          order: 2,
          isActive: true,
        },
        {
          name: 'Savings',
          type: 'savings',
          icon: 'PiggyBank',
          color: '#8b5cf6',
          initialBalance: 0,
          accountNumber: 'Reserve',
          order: 3,
          isActive: true,
        },
      ]);
      console.log('Sources seeded successfully.');
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding initial Categories...');
      const defaultCategories = [
        // Personal expenses
        { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#ef4444', order: 0, subcategories: mapSubcategories('Food & Dining', 'Utensils', '#ef4444') },
        { name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#f97316', order: 1, subcategories: mapSubcategories('Groceries', 'ShoppingBag', '#f97316') },
        { name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#3b82f6', order: 2, subcategories: mapSubcategories('Transport & Fuel', 'Car', '#3b82f6') },
        { name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#06b6d4', order: 3, subcategories: mapSubcategories('Utilities & Bills', 'Zap', '#06b6d4') },
        { name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#6366f1', order: 4, subcategories: mapSubcategories('Rent & Housing', 'Home', '#6366f1') },
        { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#14b8a6', order: 5, subcategories: mapSubcategories('Healthcare', 'HeartPulse', '#14b8a6') },
        { name: 'Entertainment', type: 'expense', icon: 'Gamepad2', color: '#ec4899', order: 6, subcategories: mapSubcategories('Entertainment', 'Gamepad2', '#ec4899') },

        // Office expenses
        { name: 'Office Supplies', type: 'expense', icon: 'FileText', color: '#eab308', order: 7, baseTypeId: officeType?._id || null, subcategories: mapSubcategories('Office Supplies', 'FileText', '#eab308') },
        { name: 'Team Lunch & Coffee', type: 'expense', icon: 'Coffee', color: '#84cc16', order: 8, baseTypeId: officeType?._id || null, subcategories: mapSubcategories('Team Lunch & Coffee', 'Coffee', '#84cc16') },
        { name: 'Software & Subscriptions', type: 'expense', icon: 'Laptop', color: '#a855f7', order: 9, baseTypeId: officeType?._id || null, subcategories: mapSubcategories('Software & Subscriptions', 'Laptop', '#a855f7') },
        { name: 'Office Rent & Maintenance', type: 'expense', icon: 'Building2', color: '#f43f5e', order: 10, baseTypeId: officeType?._id || null, subcategories: mapSubcategories('Office Rent & Maintenance', 'Building2', '#f43f5e') },
        { name: 'Internet & Tech', type: 'expense', icon: 'Wifi', color: '#0284c7', order: 11, subcategories: mapSubcategories('Internet & Tech', 'Wifi', '#0284c7') },
        { name: 'Miscellaneous', type: 'expense', icon: 'CircleEllipsis', color: '#64748b', order: 12, subcategories: mapSubcategories('Miscellaneous', 'CircleEllipsis', '#64748b') },

        // Incomes
        { name: 'Salary', type: 'income', icon: 'CircleDollarSign', color: '#10b981', order: 0, subcategories: mapSubcategories('Salary', 'CircleDollarSign', '#10b981') },
        { name: 'Business Revenue', type: 'income', icon: 'TrendingUp', color: '#059669', order: 1, baseTypeId: officeType?._id || null, subcategories: mapSubcategories('Business Revenue', 'TrendingUp', '#059669') },
        { name: 'Freelance & Bonus', type: 'income', icon: 'Banknote', color: '#0284c7', order: 2, subcategories: mapSubcategories('Freelance & Bonus', 'Banknote', '#0284c7') },
        { name: 'Other Income', type: 'income', icon: 'Coins', color: '#8b5cf6', order: 3, subcategories: mapSubcategories('Other Income', 'Coins', '#8b5cf6') },
      ];

      await Category.insertMany(defaultCategories);
      console.log('Categories seeded successfully.');
    }

    // Always reconcile default subcategories so existing databases get populated
    await reconcileDefaultSubcategories();

    // Always reconcile sources to guarantee valid scope allocations
    await reconcileSourceScopeAllocations();
  } catch (error) {
    console.error('Error during initial seed:', error);
  }
};

export const reconcileDefaultSubcategories = async () => {
  try {
    const categories = await Category.find();
    for (const cat of categories) {
      const defaultSubs = DEFAULT_SUBCATEGORIES[cat.name];
      if (!defaultSubs || defaultSubs.length === 0) continue;

      const existingSubNames = new Set(
        (cat.subcategories || []).map((s) => s.name?.toLowerCase())
      );
      const toAdd: any[] = [];

      for (const subName of defaultSubs) {
        if (!existingSubNames.has(subName.toLowerCase())) {
          toAdd.push({
            name: subName,
            icon: cat.icon || 'Tag',
            color: cat.color || '#3b82f6',
          });
        }
      }

      if (toAdd.length > 0) {
        if (!cat.subcategories) {
          cat.subcategories = [];
        }
        cat.subcategories.push(...toAdd);
        await cat.save();
        console.log(`Reconciled ${toAdd.length} subcategory(s) for: ${cat.name}`);
      }
    }
  } catch (err) {
    console.error('Error reconciling default subcategories:', err);
  }
};

export const reconcileSourceScopeAllocations = async () => {
  try {
    const baseTypes = await BaseType.find().sort({ order: 1, createdAt: 1 });
    if (baseTypes.length === 0) return;
    const defaultBaseType = baseTypes.find((b) => b.isDefault) || baseTypes[0];

    const sources = await Source.find();
    for (const source of sources) {
      let changed = false;
      const allocations = source.scopeAllocations || [];
      const currentSum = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

      // If allocations is empty or total allocations is 0, but source has initialBalance > 0:
      if (allocations.length === 0 || (currentSum === 0 && (source.initialBalance || 0) > 0)) {
        const initialAmt = source.initialBalance || 0;
        source.scopeAllocations = baseTypes.map((bt) => ({
          baseTypeId: bt._id,
          amount: bt._id.toString() === defaultBaseType._id.toString() ? initialAmt : 0,
        }));
        changed = true;
      } else {
        // Ensure all active baseTypes exist in scopeAllocations (add missing ones with 0)
        for (const bt of baseTypes) {
          const exists = allocations.some(
            (a) => (a.baseTypeId?._id || a.baseTypeId)?.toString() === bt._id.toString()
          );
          if (!exists) {
            allocations.push({ baseTypeId: bt._id, amount: 0 });
            changed = true;
          }
        }
        source.scopeAllocations = allocations;
      }

      if (changed) {
        await source.save();
        console.log(`Reconciled scope allocations for source: ${source.name}`);
      }
    }
  } catch (err) {
    console.error('Error reconciling source scope allocations:', err);
  }
};
