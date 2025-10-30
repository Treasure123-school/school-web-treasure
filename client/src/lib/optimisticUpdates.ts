import { queryClient } from './queryClient';
import { QueryKey } from '@tanstack/react-query';

export interface OptimisticUpdateOptions<TData = any> {
  queryKey: QueryKey;
  updateFn: (oldData: TData) => TData;
  onError?: (error: any) => void;
}

export interface OptimisticDeleteOptions<TData = any[]> {
  queryKey: QueryKey;
  idToDelete: number | string;
  idField?: string;
}

export interface OptimisticCreateOptions<TData = any[], TItem = any> {
  queryKey: QueryKey;
  newItem: TItem;
}

export interface OptimisticToggleOptions<TData = any[]> {
  queryKey: QueryKey;
  id: number | string;
  field: string;
  idField?: string;
}

export async function optimisticUpdate<TData = any>(
  options: OptimisticUpdateOptions<TData>
) {
  const { queryKey, updateFn } = options;

  await queryClient.cancelQueries({ queryKey });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData) {
    const updatedData = updateFn(previousData);
    queryClient.setQueryData<TData>(queryKey, updatedData);
  }

  return { previousData };
}

export async function optimisticDelete<TData = any[]>(
  options: OptimisticDeleteOptions<TData>
) {
  const { queryKey, idToDelete, idField = 'id' } = options;

  await queryClient.cancelQueries({ queryKey });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData && Array.isArray(previousData)) {
    const updatedData = previousData.filter(
      (item: any) => item[idField] !== idToDelete
    );
    queryClient.setQueryData<TData>(queryKey, updatedData as TData);
  }

  return { previousData };
}

export async function optimisticCreate<TData = any[], TItem = any>(
  options: OptimisticCreateOptions<TData, TItem>
) {
  const { queryKey, newItem } = options;

  await queryClient.cancelQueries({ queryKey });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData && Array.isArray(previousData)) {
    const updatedData = [newItem, ...previousData];
    queryClient.setQueryData<TData>(queryKey, updatedData as TData);
  }

  return { previousData };
}

export async function optimisticToggle<TData = any[]>(
  options: OptimisticToggleOptions<TData>
) {
  const { queryKey, id, field, idField = 'id' } = options;

  await queryClient.cancelQueries({ queryKey });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData && Array.isArray(previousData)) {
    const updatedData = previousData.map((item: any) =>
      item[idField] === id ? { ...item, [field]: !item[field] } : item
    );
    queryClient.setQueryData<TData>(queryKey, updatedData as TData);
  }

  return { previousData };
}

export async function optimisticUpdateItem<TData = any[], TItem = any>(
  queryKey: QueryKey,
  id: number | string,
  updates: Partial<TItem>,
  idField: string = 'id'
) {
  await queryClient.cancelQueries({ queryKey });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData && Array.isArray(previousData)) {
    const updatedData = previousData.map((item: any) =>
      item[idField] === id ? { ...item, ...updates } : item
    );
    queryClient.setQueryData<TData>(queryKey, updatedData as TData);
  }

  return { previousData };
}

export function rollbackOnError<TData = any>(
  queryKey: QueryKey | QueryKey[],
  previousData: TData | undefined
) {
  if (previousData !== undefined) {
    if (Array.isArray(queryKey[0])) {
      (queryKey as QueryKey[]).forEach(key => {
        queryClient.setQueryData<TData>(key, previousData);
      });
    } else {
      queryClient.setQueryData<TData>(queryKey as QueryKey, previousData);
    }
  }
}

export async function invalidateAndRefetch(queryKeys: QueryKey[]) {
  await Promise.all(
    queryKeys.map(key =>
      queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' })
    )
  );
}
