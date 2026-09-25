import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { BaseType, Source, Category, Transaction, StatsResponse } from './types';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ManageHub } from './pages/manage/ManageHub';
import { TransactionModal } from './components/transactions/TransactionModal';
import { FilterState } from './components/transactions/TransactionFilters';
import { ConfirmModal } from './components/common/ConfirmModal';
import { TopLoadingBar } from './components/common/TopLoadingBar';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { CheckCircle, AlertCircle, Wallet, Loader2 } from 'lucide-react';

function MainApp() {
  const { user, token, isLoading: isAuthLoading, updatePreferences } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Track user default scope and tab bar order preferences
  const [defaultScopePreference, setDefaultScopePreference] = useState<string>(() => {
    return localStorage.getItem('expense_default_scope') || user?.defaultScope || 'personal';
  });

  const [scopeBarOrder, setScopeBarOrder] = useState<'default_first' | 'all_first'>(() => {
    const saved = localStorage.getItem('expense_scope_bar_order');
    if (saved === 'all_first' || saved === 'default_first') return saved;
    return (user?.scopeBarOrder as 'default_first' | 'all_first') || 'default_first';
  });

  // selectedScope is initialized to saved preference or empty until resolved
  const [selectedScope, setSelectedScope] = useState<string>(() => {
    const saved = localStorage.getItem('expense_default_scope') || user?.defaultScope;
    if (saved && saved !== 'personal') return saved;
    return '';
  });

  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  // Entities Data
  const [baseTypes, setBaseTypes] = useState<BaseType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    baseTypeId: 'all',
    sourceId: 'all',
    categoryId: 'all',
    dateRange: 'all',
  });

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Loading & Toast Notification
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // 1. Load initial metadata (BaseTypes, Sources, Categories)
  const loadMetadata = useCallback(async () => {
    try {
      const bTypes = await api.getBaseTypes();
      setBaseTypes(bTypes);

      // Determine initial scope resolution if needed
      let current = selectedScope;
      if (!current || current === 'personal') {
        const savedPref = localStorage.getItem('expense_default_scope') || user?.defaultScope;
        if (savedPref === 'all') {
          current = 'all';
        } else if (savedPref && bTypes.some((b) => b._id === savedPref)) {
          current = savedPref;
        } else {
          // Default to Personal or the isDefault baseType!
          const defaultBt =
            bTypes.find((b) => b.isDefault) ||
            bTypes.find((b) => b.name.toLowerCase() === 'personal') ||
            bTypes[0];
          current = defaultBt ? defaultBt._id : 'all';
        }
        setSelectedScope(current);
        setDefaultScopePreference(current);
        localStorage.setItem('expense_default_scope', current);
        setFilters((prev) => ({ ...prev, baseTypeId: current }));
      }

      const [srcs, allSrcs, cats] = await Promise.all([
        api.getSources(current !== 'all' ? current : undefined),
        api.getSources(current !== 'all' ? current : undefined, true),
        api.getCategories(),
      ]);
      setSources(srcs);
      setAllSources(allSrcs);
      setCategories(cats);
      setIsMetadataLoaded(true);
    } catch (err: any) {
      console.error('Failed to load initial metadata:', err);
    }
  }, [selectedScope, user]);

  // 2. Load Transactions & Stats based on selected scope and filters
  const loadTransactionsAndStats = useCallback(async () => {
    if (!selectedScope || selectedScope === 'personal') return;

    try {
      setIsLoading(true);

      const effectiveScope =
        filters.baseTypeId !== 'all'
          ? filters.baseTypeId
          : selectedScope !== 'all'
          ? selectedScope
          : undefined;

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        startDate = today;
        endDate = today;
      } else if (filters.dateRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
      } else if (filters.dateRange === 'month') {
        const d = new Date();
        d.setDate(1);
        startDate = d.toISOString().split('T')[0];
      }

      const [txResponse, statsResponse, srcs, allSrcs] = await Promise.all([
        api.getTransactions({
          baseTypeId: effectiveScope,
          sourceId: filters.sourceId !== 'all' ? filters.sourceId : undefined,
          categoryId: filters.categoryId !== 'all' ? filters.categoryId : undefined,
          type: filters.type !== 'all' ? filters.type : undefined,
          startDate,
          endDate,
          limit: 100,
        }),
        api.getStats({
          baseTypeId: effectiveScope,
          startDate,
          endDate,
        }),
        api.getSources(effectiveScope),
        api.getSources(effectiveScope, true),
      ]);

      setTransactions(txResponse.transactions);
      setStats(statsResponse);
      setSources(srcs);
      setAllSources(allSrcs);
    } catch (err: any) {
      console.error('Failed to load transactions and stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScope, filters]);

  // Initial load when token is present
  useEffect(() => {
    if (token) {
      loadMetadata();
    }
  }, [token, loadMetadata]);

  useEffect(() => {
    if (token && isMetadataLoaded && selectedScope && selectedScope !== 'personal') {
      loadTransactionsAndStats();
    }
  }, [token, isMetadataLoaded, selectedScope, filters, loadTransactionsAndStats]);

  // Handle Scope Switching from Top Header
  const handleSelectScope = (scopeId: string) => {
    setSelectedScope(scopeId);
    setFilters((prev) => ({ ...prev, baseTypeId: scopeId }));
  };

  // Transaction Actions
  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit._id, data);
        showToast('Transaction updated successfully');
      } else {
        await api.createTransaction(data);
        showToast('Transaction logged successfully');
      }
      setTransactionToEdit(null);
      setIsQuickAddOpen(false);
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to save transaction', 'error');
      throw err;
    }
  };

  const handleConfirmDeleteTx = async () => {
    if (!txToDelete) return;
    try {
      await api.deleteTransaction(txToDelete._id);
      showToast('Transaction deleted');
      setTxToDelete(null);
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // BaseType (Scope) Handlers
  const handleSetDefaultScope = async (scopeId: string) => {
    try {
      setDefaultScopePreference(scopeId);
      localStorage.setItem('expense_default_scope', scopeId);
      setSelectedScope(scopeId);
      setFilters((prev) => ({ ...prev, baseTypeId: scopeId }));

      // Save user preference
      await updatePreferences({ defaultScope: scopeId });

      // If a BaseType was selected (not 'all'), also update isDefault in BaseType
      if (scopeId !== 'all') {
        await api.updateBaseType(scopeId, { isDefault: true });
        setBaseTypes((prev) =>
          prev.map((b) => ({
            ...b,
            isDefault: b._id === scopeId,
          }))
        );
      }

      const scopeName =
        scopeId === 'all'
          ? 'All Scopes'
          : baseTypes.find((b) => b._id === scopeId)?.name || 'Scope';
      showToast(`Default view set to ${scopeName}`);
    } catch (err: any) {
      console.error('Failed to set default scope:', err);
      showToast(err.message || 'Failed to update default scope', 'error');
    }
  };

  const handleSetScopeBarOrder = async (order: 'default_first' | 'all_first') => {
    try {
      setScopeBarOrder(order);
      localStorage.setItem('expense_scope_bar_order', order);
      await updatePreferences({ scopeBarOrder: order });
      showToast(
        order === 'default_first'
          ? 'Top bar updated: Default scope shows first'
          : 'Top bar updated: All Scopes shows first'
      );
    } catch (err: any) {
      console.error('Failed to update scope bar order:', err);
      showToast(err.message || 'Failed to update bar arrangement', 'error');
    }
  };

  const handleCreateBaseType = async (data: Partial<BaseType>) => {
    try {
      await api.createBaseType(data);
      showToast('New scope created');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to create scope', 'error');
    }
  };

  const handleUpdateBaseType = async (id: string, data: Partial<BaseType>) => {
    try {
      await api.updateBaseType(id, data);
      if (data.isDefault) {
        setDefaultScopePreference(id);
        localStorage.setItem('expense_default_scope', id);
        updatePreferences({ defaultScope: id });
      }
      showToast('Scope updated');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update scope', 'error');
    }
  };

  const handleDeleteBaseType = async (id: string, force: boolean = false) => {
    try {
      await api.deleteBaseType(id, force);
      showToast('Scope deleted');
      if (selectedScope === id || defaultScopePreference === id) {
        const remaining = baseTypes.filter((b) => b._id !== id);
        const fallback =
          remaining.find((b) => b.isDefault)?._id ||
          remaining.find((b) => b.name.toLowerCase() === 'personal')?._id ||
          remaining[0]?._id ||
          'all';
        setSelectedScope(fallback);
        setDefaultScopePreference(fallback);
        localStorage.setItem('expense_default_scope', fallback);
        updatePreferences({ defaultScope: fallback });
      }
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete scope', 'error');
    }
  };

  // Payment Source Handlers
  const handleCreateSource = async (data: Partial<Source>) => {
    try {
      await api.createSource(data);
      showToast('New payment source added');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to create source', 'error');
    }
  };

  const handleUpdateSource = async (id: string, data: Partial<Source>) => {
    try {
      await api.updateSource(id, data);
      showToast('Source updated');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update source', 'error');
    }
  };

  const handleDeleteSource = async (id: string, force: boolean = false) => {
    try {
      await api.deleteSource(id, force);
      showToast('Source deleted');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete source', 'error');
    }
  };

  // Category Handlers
  const handleCreateCategory = async (data: Partial<Category>) => {
    try {
      await api.createCategory(data);
      showToast('New category created');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleUpdateCategory = async (id: string, data: Partial<Category>) => {
    try {
      await api.updateCategory(id, data);
      showToast('Category updated');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string, force: boolean = false) => {
    try {
      await api.deleteCategory(id, force);
      showToast('Category deleted');
      loadMetadata();
      loadTransactionsAndStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // 1. Loading splash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 space-y-4">
        <TopLoadingBar />
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 animate-pulse">
          <Wallet size={26} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin text-blue-400" />
          <span>Starting Expense Manager...</span>
        </div>
      </div>
    );
  }

  // 2. Authentication view if not logged in
  if (!token || !user) {
    return (
      <>
        <TopLoadingBar />
        {authScreen === 'register' ? (
          <RegisterPage onSwitchToLogin={() => setAuthScreen('login')} />
        ) : (
          <LoginPage onSwitchToRegister={() => setAuthScreen('register')} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Global Top Loading Bar for API Calls */}
      <TopLoadingBar />

      {/* Sticky Mobile Header with Scope Selector & Privacy Toggle */}
      <MobileHeader
        baseTypes={baseTypes}
        selectedScope={selectedScope}
        defaultScope={defaultScopePreference}
        scopeBarOrder={scopeBarOrder}
        onSelectScope={handleSelectScope}
        onOpenNewScopeModal={() => setActiveTab('manage')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-4">
        {activeTab === 'dashboard' && (
          <DashboardPage
            baseTypes={baseTypes}
            sources={sources}
            stats={stats}
            recentTransactions={transactions}
            selectedScope={selectedScope}
            onSelectScope={handleSelectScope}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onOpenQuickAdd={() => {
              setTransactionToEdit(null);
              setIsQuickAddOpen(true);
            }}
            onEditTransaction={(tx) => {
              setTransactionToEdit(tx);
              setIsQuickAddOpen(true);
            }}
            onDeleteTransaction={(tx) => setTxToDelete(tx)}
            onRefresh={() => {
              loadMetadata();
              loadTransactionsAndStats();
            }}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            baseTypes={baseTypes}
            sources={allSources}
            categories={categories}
            filters={filters}
            onUpdateFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            onResetFilters={() =>
              setFilters({
                type: 'all',
                baseTypeId: selectedScope,
                sourceId: 'all',
                categoryId: 'all',
                dateRange: 'all',
              })
            }
            onOpenQuickAdd={() => {
              setTransactionToEdit(null);
              setIsQuickAddOpen(true);
            }}
            onEditTransaction={(tx) => {
              setTransactionToEdit(tx);
              setIsQuickAddOpen(true);
            }}
            onDeleteTransaction={(tx) => setTxToDelete(tx)}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            stats={stats}
            baseTypes={baseTypes}
            selectedScope={selectedScope}
            onRefresh={loadTransactionsAndStats}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'manage' && (
          <ManageHub
            baseTypes={baseTypes}
            sources={allSources}
            categories={categories}
            defaultScope={defaultScopePreference}
            scopeBarOrder={scopeBarOrder}
            onSetDefaultScope={handleSetDefaultScope}
            onSetScopeBarOrder={handleSetScopeBarOrder}
            onCreateBaseType={handleCreateBaseType}
            onUpdateBaseType={handleUpdateBaseType}
            onDeleteBaseType={handleDeleteBaseType}
            onCreateSource={handleCreateSource}
            onUpdateSource={handleUpdateSource}
            onDeleteSource={handleDeleteSource}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onRefresh={() => {
              loadMetadata();
              loadTransactionsAndStats();
            }}
          />
        )}
      </main>

      {/* Mobile-Friendly Fixed Bottom Navigation with elevated FAB */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenQuickAdd={() => {
          setTransactionToEdit(null);
          setIsQuickAddOpen(true);
        }}
      />

      {/* Transaction Entry & Edit Bottom Sheet */}
      <TransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setTransactionToEdit(null);
        }}
        onSubmit={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        baseTypes={baseTypes}
        sources={allSources}
        categories={categories}
        currentScope={selectedScope}
        onCategoryUpdated={loadMetadata}
      />

      {/* Transaction Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleConfirmDeleteTx}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction for ৳ ${txToDelete?.amount}?`}
      />

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <MainApp />
      </PrivacyProvider>
    </AuthProvider>
  );
}

export default App;
