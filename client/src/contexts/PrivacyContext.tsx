import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  maskAmount: (formattedAmount: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: false,
  togglePrivacy: () => {},
  maskAmount: (amt) => amt,
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivate, setIsPrivate] = useState<boolean>(() => {
    return localStorage.getItem('expense_privacy_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('expense_privacy_mode', String(isPrivate));
  }, [isPrivate]);

  const togglePrivacy = () => {
    setIsPrivate((prev) => !prev);
  };

  const maskAmount = (formattedAmount: string): string => {
    if (!isPrivate) return formattedAmount;
    // Extract currency symbol if present
    const parts = formattedAmount.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ••••••`;
    }
    return '••••••';
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
