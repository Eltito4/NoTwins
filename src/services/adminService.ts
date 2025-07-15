import api from '../lib/api';
import toast from 'react-hot-toast';

export async function getAdminDashboard() {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    // Don't show toast here, let component handle it
    throw error;
  }
}

export async function getAdminUsers(params: any = {}) {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting admin users:', error);
    // Don't show toast here, let component handle it
    throw error;
  }
}

export async function getUserDetail(userId: string) {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user detail:', error);
    // Don't show toast here, let component handle it
    throw error;
  }
}

export async function updateUserFlag(userId: string, flag: string, value: boolean, reason?: string) {
  try {
    const response = await api.put(`/admin/users/${userId}/flag`, {
      flag,
      value,
      reason
    });
    toast.success('User flag updated successfully');
    return response.data;
  } catch (error) {
    console.error('Error updating user flag:', error);
    toast.error('Failed to update user flag');
    throw error;
  }
}

export async function getAiAnalytics(params: any = {}) {
  try {
    const response = await api.get('/admin/ai-analytics', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting AI analytics:', error);
    toast.error('Failed to load AI analytics');
    throw error;
  }
}

export async function getRevenueAnalytics(params: any = {}) {
  try {
    const response = await api.get('/admin/revenue-analytics', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    toast.error('Failed to load revenue analytics');
    throw error;
  }
}

export async function exportData(type: string, params: any = {}) {
  try {
    const response = await api.get(`/admin/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-export.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('Data exported successfully');
  } catch (error) {
    console.error('Error exporting data:', error);
    toast.error('Failed to export data');
    throw error;
  }
}