import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Project, AfricanRegion } from '../types';
import { africanRegions } from '../data/africanRegions';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      // Transform database data to match Project interface
      return data.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        targetAmount: project.target_amount,
        currentAmount: project.current_amount,
        currency: project.currency,
        region: africanRegions.find(r => r.id === project.region_id) || africanRegions[0],
        milestones: project.milestones || [],
        images: project.images || [],
        ngoAddress: project.ngo_address,
        createdAt: project.created_at,
        category: project.category
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        currency: data.currency,
        region: africanRegions.find(r => r.id === data.region_id) || africanRegions[0],
        milestones: data.milestones || [],
        images: data.images || [],
        ngoAddress: data.ngo_address,
        createdAt: data.created_at,
        category: data.category
      };
    },
    enabled: !!projectId,
  });
};

export const useUpdateProjectAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, amount }: { projectId: string; amount: number }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ current_amount: amount })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};