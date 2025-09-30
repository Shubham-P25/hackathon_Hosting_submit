// Integrated from SubmitIt/src/Components/ui/Skeleton.jsx
import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  card: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      }
    }
  },
  shimmer: {
    hidden: { x: "-100%" },
    visible: { 
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear"
      }
    }
  }
};

export const Skeleton = ({ className = "", ...props }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 animate-pulse rounded ${className}`}
    {...props}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      variants={variants.shimmer}
      initial="hidden"
      animate="visible"
    ></motion.div>
  </div>
);

export const CardSkeleton = () => (
  <motion.div
    variants={variants.card}
    initial="hidden"
    animate="visible"
    className="bg-white rounded-xl overflow-hidden shadow-lg p-4"
  >
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
  </motion.div>
);

export const ProfileSkeleton = () => (
  <motion.div
    variants={variants.card}
    initial="hidden"
    animate="visible"
    className="bg-white rounded-xl overflow-hidden shadow-lg p-6"
  >
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
  </motion.div>
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
  <motion.div
    variants={variants.card}
    initial="hidden"
    animate="visible"
    className="space-y-6"
  >
    <Skeleton className="h-10 w-full rounded" />
    <Skeleton className="h-10 w-full rounded" />
    <Skeleton className="h-32 w-full rounded" />
    <Skeleton className="h-10 w-32 rounded" />
  </motion.div>
);

export default {
  Base: Skeleton,
  Card: CardSkeleton,
  Profile: ProfileSkeleton,
  TableRow: TableRowSkeleton,
  Form: FormSkeleton,
};
