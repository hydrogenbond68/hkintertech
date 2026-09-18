import React from 'react';
import ProductSkeleton from './ProductSkeleton';

const ProductGridSkeleton = ({ count = 8, gridClass = 'grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6' }) => {
  return (
    <div className={`grid gap-2 sm:gap-4 ${gridClass}`}>
      {[...Array(count)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;