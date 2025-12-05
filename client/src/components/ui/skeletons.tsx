import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SkeletonBaseProps {
  className?: string;
}

export function MinimalRouteFallback() {
  return (
    <div 
      className="min-h-screen w-full bg-background" 
      data-testid="minimal-route-fallback"
      style={{ opacity: 0.01 }}
    />
  );
}

export function SkeletonShimmer({ className, ...props }: SkeletonBaseProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)} data-testid="skeleton-card">
      <SkeletonShimmer className="h-4 w-3/4" />
      <SkeletonShimmer className="h-8 w-1/2" />
      <SkeletonShimmer className="h-3 w-full" />
    </div>
  );
}

export function StatsCardSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)} data-testid="skeleton-stats-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <SkeletonShimmer className="h-4 w-24" />
        <SkeletonShimmer className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonShimmer className="h-8 w-20 mb-1" />
      <SkeletonShimmer className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0" data-testid="skeleton-table-row">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonShimmer 
          key={i} 
          className={cn("h-4", i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "flex-1")} 
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)} data-testid="skeleton-table">
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonShimmer key={i} className={cn("h-4", i === 0 ? "w-32" : "flex-1")} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2" data-testid="skeleton-form-field">
      <SkeletonShimmer className="h-4 w-24" />
      <SkeletonShimmer className="h-10 w-full" />
    </div>
  );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)} data-testid="skeleton-form">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonShimmer className="h-10 w-24" />
        <SkeletonShimmer className="h-10 w-20" />
      </div>
    </div>
  );
}

export function SidebarSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("w-64 border-r bg-sidebar p-4 space-y-6", className)} data-testid="skeleton-sidebar">
      <div className="flex items-center gap-3">
        <SkeletonShimmer className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonShimmer className="h-4 w-24" />
          <SkeletonShimmer className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonShimmer key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("p-6 space-y-6", className)} data-testid="skeleton-dashboard">
      <div className="flex items-center justify-between gap-4">
        <SkeletonShimmer className="h-8 w-48" />
        <SkeletonShimmer className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <SkeletonShimmer className="h-6 w-32" />
          <SkeletonShimmer className="h-48 w-full" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <SkeletonShimmer className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonShimmer className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonShimmer className="h-4 w-3/4" />
                  <SkeletonShimmer className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)} data-testid="skeleton-chart">
      <SkeletonShimmer className="h-6 w-32 mb-4" />
      <SkeletonShimmer className="h-64 w-full" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3" data-testid="skeleton-list-item">
      <SkeletonShimmer className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonShimmer className="h-4 w-3/4" />
        <SkeletonShimmer className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card divide-y", className)} data-testid="skeleton-list">
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("p-6 space-y-6", className)} data-testid="skeleton-profile">
      <div className="flex items-center gap-4">
        <SkeletonShimmer className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonShimmer className="h-6 w-48" />
          <SkeletonShimmer className="h-4 w-32" />
          <SkeletonShimmer className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-6", className)} data-testid="skeleton-page-header">
      <div className="space-y-1">
        <SkeletonShimmer className="h-8 w-48" />
        <SkeletonShimmer className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <SkeletonShimmer className="h-9 w-24" />
        <SkeletonShimmer className="h-9 w-32" />
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="flex h-screen w-full" data-testid="skeleton-app-shell">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <SkeletonShimmer className="h-6 w-6" />
          <div className="flex items-center gap-4">
            <SkeletonShimmer className="h-8 w-8 rounded-full" />
            <SkeletonShimmer className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ContentOnlySkeleton({ variant = 'dashboard' }: { variant?: 'dashboard' | 'table' | 'form' | 'profile' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className="w-full"
      data-testid="skeleton-content-only"
    >
      {variant === 'dashboard' && <DashboardSkeleton />}
      {variant === 'table' && <TableSkeleton rows={8} columns={5} className="p-6" />}
      {variant === 'form' && <FormSkeleton fields={5} className="max-w-2xl" />}
      {variant === 'profile' && <ProfileSkeleton />}
    </motion.div>
  );
}

export function PageContentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className="p-6 space-y-6 animate-in fade-in duration-150"
      data-testid="skeleton-page-content"
    >
      <div className="flex items-center justify-between gap-4">
        <SkeletonShimmer className="h-8 w-48" />
        <div className="flex gap-2">
          <SkeletonShimmer className="h-9 w-24" />
          <SkeletonShimmer className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SkeletonShimmer className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonShimmer key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="skeleton-login">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <SkeletonShimmer className="h-16 w-16 rounded-full mx-auto" />
          <SkeletonShimmer className="h-6 w-48 mx-auto" />
          <SkeletonShimmer className="h-4 w-32 mx-auto" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <SkeletonShimmer className="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

export function AnnouncementCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3" data-testid="skeleton-announcement">
      <div className="flex items-start gap-3">
        <SkeletonShimmer className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonShimmer className="h-5 w-3/4" />
          <SkeletonShimmer className="h-3 w-24" />
        </div>
      </div>
      <SkeletonShimmer className="h-16 w-full" />
      <div className="flex gap-2">
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
        <SkeletonShimmer className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function GradesSkeleton({ className }: SkeletonBaseProps) {
  return (
    <div className={cn("p-6 space-y-6", className)} data-testid="skeleton-grades">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}

export function ContentFadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ 
        duration: 0.2, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SkeletonTransition({ 
  isLoading, 
  skeleton, 
  children 
}: { 
  isLoading: boolean; 
  skeleton: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
