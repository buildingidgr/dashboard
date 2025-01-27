import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/services/auth';

export function usePublicOpportunities() {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error('No access token available');
        }

        const response = await fetch('/api/opportunities?page=1&limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }

        const data = await response.json();
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return { total, loading, error };
} 