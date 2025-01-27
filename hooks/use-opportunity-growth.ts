import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/services/auth';

export interface GrowthData {
  date: string;
  value: number;
}

export interface GrowthMetadata {
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalOpportunities: number;
}

export interface GrowthResponse {
  data: GrowthData[];
  metadata: GrowthMetadata;
}

interface UseOpportunityGrowthProps {
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

export function useOpportunityGrowth({ 
  interval = 'monthly',
  startDate,
  endDate 
}: UseOpportunityGrowthProps = {}) {
  const [data, setData] = useState<GrowthData[]>([]);
  const [metadata, setMetadata] = useState<GrowthMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGrowthData() {
      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error('No access token available');
        }

        const params = new URLSearchParams({ interval });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`/api/opportunities/stats/growth?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch growth data');
        }

        const result: GrowthResponse = await response.json();
        setData(result.data);
        setMetadata(result.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch growth data');
      } finally {
        setLoading(false);
      }
    }

    fetchGrowthData();
  }, [interval, startDate, endDate]);

  return { data, metadata, loading, error };
} 