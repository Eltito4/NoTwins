import { useState, useEffect } from 'react';
import api from '../lib/api';

interface HealthStatus {
  status: 'ok' | 'error';
  error?: string;
  credentials: {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
  };
  grok?: {
    initialized: boolean;
    hasApiKey: boolean;
    error?: string;
  };
}

export function useVisionStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vision/health');
      setStatus(data);
    } catch (error) {
      console.error('Vision API health check failed:', error);
      setStatus({
        status: 'error',
        error: 'Connection failed',
        credentials: {
          hasProjectId: false,
          hasClientEmail: false,
          hasPrivateKey: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { status, loading, checkHealth };
}