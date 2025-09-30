// Integrated from SubmitIt/src/Components/ui/Skeleton.jsx
import React from 'react';

export const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded', ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 ${width} ${height} ${rounded} ${className}`}
    {...props}
  />
);

export const SkeletonText = ({ lines = 3, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} />
    ))}
  </div>
);

export const SkeletonCircle = ({ size = 'h-10 w-10', className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded-full ${size} ${className}`}
    {...props}
  />
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-lg p-4">
    <Skeleton className="h-48 w-full mb-4 rounded-lg" />
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-5/6 mb-4" />
    <div className="flex gap-2 mb-4">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-lg p-6">
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 py-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-full max-w-[200px] mb-2" />
      <Skeleton className="h-3 w-full max-w-[160px]" />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-full rounded" />
    <Skeleton className="h-10 w-full rounded" />
    <Skeleton className="h-32 w-full rounded" />
    <Skeleton className="h-10 w-32 rounded" />
  </div>
);

export default {
  Base: Skeleton,
  Card: CardSkeleton,
  Profile: ProfileSkeleton,
  TableRow: TableRowSkeleton,
  Form: FormSkeleton,
};
