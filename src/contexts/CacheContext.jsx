import React, { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext(null);

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};

export const CacheProvider = ({ children }) => {
  const [productVersion, setProductVersion] = useState(0);
  const [orderVersion, setOrderVersion] = useState(0);

  const invalidateProducts = useCallback(() => {
    setProductVersion(prev => prev + 1);
  }, []);

  const invalidateOrders = useCallback(() => {
    setOrderVersion(prev => prev + 1);
  }, []);

  const value = {
    productVersion,
    orderVersion,
    invalidateProducts,
    invalidateOrders,
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export default CacheContext;