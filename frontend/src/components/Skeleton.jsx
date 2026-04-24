import { Skeleton } from 'boneyard-js/react';

/**
 * Boneyard-js wrappers
 * These will show a pixel-perfect skeleton if 'loading' is true,
 * otherwise they render the children.
 */

export function PageSkeleton({ children, loading }) {
  return (
    <Skeleton name="page" loading={loading}>
      {children}
    </Skeleton>
  );
}

export function AdCardSkeleton({ children, loading }) {
  return (
    <Skeleton name="ad-card" loading={loading}>
      {children}
    </Skeleton>
  );
}

export function CategorySkeleton({ children, loading }) {
  return (
    <Skeleton name="category" loading={loading}>
      {children}
    </Skeleton>
  );
}
