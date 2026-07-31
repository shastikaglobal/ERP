import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


export function useSupabaseCrud(tableName: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
      });

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { data, error } = await supabase.from(tableName as any).insert(newData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase.from(tableName as any).update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    }
  });

  return {
    data: data || [],
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync
  };
}

export function useFarmers() {
  const { data, isLoading } = useQuery({
    queryKey: ['farmers_list_core'],
    queryFn: async () => {
      const { data, error } = await supabase.from('farmers').select('id, full_name, code, phone, village, district, state, is_active, verification_status, kyc_status').eq('is_deleted', false);
      if (error) throw error;
      return data;
    }
  });
  return { farmers: data || [], isLoading };
}
