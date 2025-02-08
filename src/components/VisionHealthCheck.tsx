import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface HealthStatus {
  status: 'ok' | 'error';
  error?: string;
  credentials: {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
  };
}

export function VisionHealthCheck() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vision/health');
      setStatus(data);
      
      if (data.status === 'error') {
        const missingCredentials = Object.entries(data.credentials)
          .filter(([_, value]) => !value)
          .map(([key]) => key.replace('has', ''))
          .join(', ');

        if (missingCredentials) {
          toast.error(`Missing credentials: ${missingCredentials}`);
        } else {
          toast.error(data.error || 'Vision API health check failed');
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Failed to check Vision API status');
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
    // Check health status every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status && !loading) return null;

  return (
    <div className="fixed bottom-4 left-4">
      <button
        onClick={checkHealth}
        disabled={loading}
        className="bg-white p-3 rounded-lg shadow-lg flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        {loading ? (
          <Activity className="w-5 h-5 text-blue-500 animate-spin" />
        ) : status?.status === 'ok' ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div className="text-left">
          <p className="text-sm font-medium">Vision API Status</p>
          <p className="text-xs text-gray-500">
            {loading
              ? 'Checking...'
              : status?.status === 'ok'
              ? 'Connected'
              : 'Connection Error'}
          </p>
        </div>
        {status?.credentials && !loading && (
          <div className="ml-2 border-l pl-2">
            {Object.entries(status.credentials).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                {value ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
                <span className="text-xs text-gray-500">
                  {key.replace('has', '')}
                </span>
              </div>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

export { VisionHealthCheck }