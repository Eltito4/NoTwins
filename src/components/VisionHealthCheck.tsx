import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../lib/api';

interface HealthStatus {
  status: 'ok' | 'error';
  error?: string;
  credentials: {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
  };
  gemini?: {
    initialized: boolean;
    hasApiKey: boolean;
  };
}

export function VisionHealthCheck() {
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

  const getStatusColor = () => {
    if (loading) return 'text-yellow-500';
    if (!status) return 'text-red-500';
    return status.status === 'ok' ? 'text-green-500' : 'text-red-500';
  };

  const getStatusTitle = () => {
    if (loading) return 'Connecting...';
    if (!status) return 'Connection Error';
    return status.status === 'ok' ? 'Connected' : 'Connection Error';
  };

  return (
    <button
      onClick={checkHealth}
      disabled={loading}
      className={`relative p-1.5 rounded-lg hover:bg-gray-100 ${getStatusColor()}`}
      title={getStatusTitle()}
    >
      <Activity size={18} className={loading ? 'animate-spin' : ''} />
    </button>
  );
}