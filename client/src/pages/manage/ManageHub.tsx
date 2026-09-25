import React, { useState } from 'react';
import { Layers, Landmark, Tag } from 'lucide-react';
import { BaseType, Source, Category } from '../../types';
import { ManageBaseTypes } from './ManageBaseTypes';
import { ManageSources } from './ManageSources';
import { ManageCategories } from './ManageCategories';

interface ManageHubProps {
  baseTypes: BaseType[];
  sources: Source[];
  categories: Category[];
  defaultScope?: string;
  scopeBarOrder?: 'default_first' | 'all_first';
  onSetDefaultScope?: (scopeId: string) => Promise<void>;
  onSetScopeBarOrder?: (order: 'default_first' | 'all_first') => Promise<void>;
  onCreateBaseType: (data: Partial<BaseType>) => Promise<void>;
  onUpdateBaseType: (id: string, data: Partial<BaseType>) => Promise<void>;
  onDeleteBaseType: (id: string, force?: boolean) => Promise<void>;
  onCreateSource: (data: Partial<Source>) => Promise<void>;
  onUpdateSource: (id: string, data: Partial<Source>) => Promise<void>;
  onDeleteSource: (id: string, force?: boolean) => Promise<void>;
  onCreateCategory: (data: Partial<Category>) => Promise<void>;
  onUpdateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string, force?: boolean) => Promise<void>;
  onRefresh: () => void;
}

export const ManageHub: React.FC<ManageHubProps> = ({
  baseTypes,
  sources,
  categories,
  defaultScope,
  scopeBarOrder,
  onSetDefaultScope,
  onSetScopeBarOrder,
  onCreateBaseType,
  onUpdateBaseType,
  onDeleteBaseType,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'scopes' | 'sources' | 'categories'>('scopes');

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-extrabold text-white tracking-tight">Management Hub</h2>
        <p className="text-xs text-slate-400">
          Customize your Scopes, Payment Accounts, and Categories
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#131927] rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('scopes')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'scopes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Scopes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sources')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'sources'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark size={14} />
          <span>Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag size={14} />
          <span>Categories</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'scopes' && (
        <ManageBaseTypes
          baseTypes={baseTypes}
          defaultScope={defaultScope}
          scopeBarOrder={scopeBarOrder}
          onSetDefaultScope={onSetDefaultScope}
          onSetScopeBarOrder={onSetScopeBarOrder}
          onCreate={onCreateBaseType}
          onUpdate={onUpdateBaseType}
          onDelete={onDeleteBaseType}
        />
      )}

      {activeTab === 'sources' && (
        <ManageSources
          sources={sources}
          baseTypes={baseTypes}
          onCreate={onCreateSource}
          onUpdate={onUpdateSource}
          onDelete={onDeleteSource}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'categories' && (
        <ManageCategories
          categories={categories}
          baseTypes={baseTypes}
          onCreate={onCreateCategory}
          onUpdate={onUpdateCategory}
          onDelete={onDeleteCategory}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
