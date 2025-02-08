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
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vision/health');
      
      // Check if any credentials are missing
      const missingCredentials = Object.entries(data.credentials)
        .filter(([_, value]) => !value)
        .map(([key]) => key.replace('has', ''));

      if (missingCredentials.length > 0) {
        toast.error(`Missing Vision API credentials: ${missingCredentials.join(', ')}`);
      }

      setStatus(data);
    } catch (error) {
      console.error('Vision API health check failed:', error);
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
    // Check status every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status && !loading) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow">
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-3 min-w-[200px]"
          title="Check Vision API Status"
        >
          {loading ? (
            <Activity className="w-5 h-5 text-blue-500 animate-spin" />
          ) : status?.status === 'ok' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-gray-800">Vision API Status</p>
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
    </div>
  );
}