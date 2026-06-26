import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { clearUserDataCache } from '@/lib/nudgeUtils';

export function useGoalsQuery() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.SavingsGoal.filter({ status: 'active' }),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newGoal) => base44.entities.SavingsGoal.create(newGoal),
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old) => [
        ...(old || []),
        { ...newGoal, id: `temp-${Date.now()}`, current_amount: 0 },
      ]);
      return { previousGoals };
    },
    onError: (_err, _newGoal, context) => {
      queryClient.setQueryData(['goals'], context.previousGoals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      clearUserDataCache();
    },
  });
}

export function useLogPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ purchase, verdictId }) => {
      const created = await base44.entities.Purchase.create(purchase);
      if (verdictId) {
        await base44.entities.PurchaseVerdict.update(verdictId, { action_taken: 'bought' });
      }
      return created;
    },
    onMutate: async ({ purchase }) => {
      await queryClient.cancelQueries({ queryKey: ['purchases'] });
      const previous = queryClient.getQueryData(['purchases']);
      queryClient.setQueryData(['purchases'], (old) => [
        { ...purchase, id: `temp-${Date.now()}` },
        ...(old || []),
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['purchases'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      clearUserDataCache();
    },
  });
}