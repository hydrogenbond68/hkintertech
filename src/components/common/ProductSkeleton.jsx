import React from 'react';

const ProductSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-2 sm:p-3 lg:p-4 animate-pulse ${className}`}>
      <div className="bg-gray-200 h-32 sm:h-40 md:h-48 lg:h-44 xl:h-48 rounded-lg mb-3 sm:mb-4"></div>
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
};

export default ProductSkeleton;