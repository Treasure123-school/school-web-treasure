# Optimistic UI Update Pattern

## Overview
All mutations in this application use **optimistic updates** to provide instant UI feedback. When a user clicks a button, the UI updates immediately—before the backend confirms success—creating a responsive, modern user experience.

## Core Principles

### 1. Instant Visual Feedback
Every button action shows immediate results:
- **Loading Toast**: Shows "Processing..." immediately on click
- **UI Update**: Data changes instantly in the interface
- **Success Toast**: Confirms when backend completes
- **Error Rollback**: Reverts changes if backend fails

### 2. Three-Phase Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    // Backend API call
    return apiRequest('POST', '/api/endpoint', data);
  },
  
  // PHASE 1: INSTANT FEEDBACK (onMutate)
  onMutate: async (newData) => {
    // 1. Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['/api/items'] });
    
    // 2. Snapshot current data for rollback
    const previousData = queryClient.getQueryData(['/api/items']);
    
    // 3. Optimistically update the UI
    queryClient.setQueryData(['/api/items'], (old: any) => {
      return [...old, newData]; // Add new item immediately
    });
    
    // 4. Show loading toast
    toast({
      title: "Creating...",
      description: "Adding new item",
    });
    
    // 5. Return context for rollback
    return { previousData };
  },
  
  // PHASE 2: SUCCESS (onSuccess)
  onSuccess: () => {
    // 1. Show success toast
    toast({
      title: "Success",
      description: "Item created successfully",
    });
    
    // 2. Invalidate queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/items'] });
  },
  
  // PHASE 3: ERROR ROLLBACK (onError)
  onError: (error, variables, context) => {
    // 1. Rollback optimistic update
    if (context?.previousData) {
      queryClient.setQueryData(['/api/items'], context.previousData);
    }
    
    // 2. Show error toast
    toast({
      title: "Error",
      description: error.message || "Failed to create item",
      variant: "destructive",
    });
  },
});
```

## Common Patterns

### Create/Add Operations
```typescript
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey: ['/api/items'] });
  const previousData = queryClient.getQueryData(['/api/items']);
  
  queryClient.setQueryData(['/api/items'], (old: any) => {
    const tempItem = { ...newItem, id: 'temp-' + Date.now() };
    return [tempItem, ...old]; // Add to beginning
  });
  
  toast({ title: "Creating...", description: "Adding new item" });
  return { previousData };
},
```

### Update/Edit Operations
```typescript
onMutate: async ({ id, updates }) => {
  await queryClient.cancelQueries({ queryKey: ['/api/items'] });
  const previousData = queryClient.getQueryData(['/api/items']);
  
  queryClient.setQueryData(['/api/items'], (old: any) => {
    return old.map((item: any) => 
      item.id === id ? { ...item, ...updates } : item
    );
  });
  
  toast({ title: "Updating...", description: "Saving changes" });
  return { previousData };
},
```

### Delete/Remove Operations
```typescript
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: ['/api/items'] });
  const previousData = queryClient.getQueryData(['/api/items']);
  
  queryClient.setQueryData(['/api/items'], (old: any) => {
    return old.filter((item: any) => item.id !== id);
  });
  
  toast({ title: "Deleting...", description: "Removing item" });
  return { previousData };
},
```

### Toggle/Activate Operations
```typescript
onMutate: async ({ id, newStatus }) => {
  await queryClient.cancelQueries({ queryKey: ['/api/items'] });
  const previousData = queryClient.getQueryData(['/api/items']);
  
  queryClient.setQueryData(['/api/items'], (old: any) => {
    return old.map((item: any) => 
      item.id === id ? { ...item, isActive: newStatus } : item
    );
  });
  
  toast({ 
    title: newStatus ? "Activating..." : "Deactivating...", 
    description: "Updating status" 
  });
  return { previousData };
},
```

## Button States

All action buttons should show loading states:

```typescript
<Button
  onClick={() => mutation.mutate(data)}
  disabled={mutation.isPending}
  data-testid="button-action"
>
  {mutation.isPending ? "Processing..." : "Submit"}
</Button>
```

## Utility Functions

Use the optimistic utility functions from `@/lib/optimistic-utils.ts`:

```typescript
import { optimisticUpdate, optimisticDelete, optimisticCreate } from '@/lib/optimistic-utils';

// For updates
const context = await optimisticUpdate(
  ['/api/items'],
  itemId,
  { status: 'active' },
  "Activating..."
);

// For deletions
const context = await optimisticDelete(
  ['/api/items'],
  itemId,
  "Deleting..."
);

// For creation
const context = await optimisticCreate(
  ['/api/items'],
  newItem,
  "Creating..."
);
```

## Real-time Synchronization

Combine optimistic updates with Supabase Realtime for multi-user sync:

```typescript
// Enable realtime for a table
useSupabaseRealtime({ 
  table: 'items', 
  queryKey: ['/api/items']
});

// When another user makes a change, Realtime will automatically
// invalidate the query and refetch fresh data
```

## Checklist for Every Mutation

- [ ] Has `onMutate` with optimistic update
- [ ] Shows loading toast in `onMutate`
- [ ] Returns `previousData` context for rollback
- [ ] Has `onSuccess` with success toast
- [ ] Invalidates queries in `onSuccess`
- [ ] Has `onError` with rollback logic
- [ ] Shows error toast in `onError`
- [ ] Button has `disabled={mutation.isPending}`
- [ ] Button shows loading state when pending

## Examples in Codebase

- ✅ **AnnouncementsManagement.tsx** - Full optimistic CRUD
- ✅ **StudentManagement.tsx** - Optimistic block/activate
- ✅ **ExamManagement.tsx** - Optimistic publish/unpublish
- ✅ **SubjectsManagement.tsx** - Optimistic create/update/delete
- ✅ **VacancyManagement.tsx** - Optimistic approve/reject
- ✅ **HomepageManagement.tsx** - Optimistic upload/update/delete

## Benefits

1. **Instant Feedback**: Users see results immediately, no waiting
2. **Professional UX**: App feels responsive and modern
3. **Error Handling**: Automatic rollback on failure
4. **Multi-user Sync**: Combined with Realtime for collaboration
5. **Offline Resilience**: UI updates even if network is slow

## Best Practices

1. **Always** cancel queries before optimistic update
2. **Always** snapshot previous data for rollback
3. **Always** show loading toasts for user feedback
4. **Always** invalidate queries on success
5. **Always** rollback on error
6. **Never** assume mutation will succeed
7. **Test** error scenarios to ensure rollback works
