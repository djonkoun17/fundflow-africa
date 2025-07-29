import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AfricanImpactMetrics } from '../types';

export const useImpactMetrics = () => {
  return useQuery({
    queryKey: ['impact-metrics'],
    queryFn: async (): Promise<AfricanImpactMetrics> => {
      const { data, error } = await supabase
        .from('african_impact_metrics')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching impact metrics:', error);
        // Return default metrics if none exist
        return {
          waterAccessImproved: 0,
          schoolsBuilt: 0,
          healthClinicsSupported: 0,
          jobsCreated: 0,
          communitiesReached: 0,
          localCurrencyImpact: {},
          projectsByCategory: {}
        };
      }

      return {
        waterAccessImproved: data.water_access_improved,
        schoolsBuilt: data.schools_built,
        healthClinicsSupported: data.health_clinics_supported,
        jobsCreated: data.jobs_created,
        communitiesReached: data.communities_reached,
        localCurrencyImpact: data.local_currency_impact,
        projectsByCategory: data.projects_by_category
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};