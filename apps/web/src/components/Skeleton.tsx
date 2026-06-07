import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-32 w-full rounded-2xl" />
    <Skeleton className="h-20 w-full rounded-2xl" />
    <Skeleton className="h-12 w-full rounded-2xl" />
  </div>
);

export default Skeleton;
