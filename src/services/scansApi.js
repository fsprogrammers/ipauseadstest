// src/services/scansApi.js
import api from './api';

/**
 * Fetch scans for a specific time period
 */
export const getScansByPeriod = async (period = 'past7', limit = 50, page = 1) => {
  try {
    const response = await api.get('/analytics/scans/by-period', {
      params: {
        period,
        limit,
        page
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch detailed information for a specific scan
 */
export const getScanDetails = async (scanId) => {
  try {
    const response = await api.get(`/analytics/scans/${scanId}`);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Format device information for display
 */
export const formatDeviceInfo = (deviceInfo) => {
  if (!deviceInfo) {
    return 'Unknown Device';
  }
  
  const parts = [];
  
  if (deviceInfo.deviceType) {
    parts.push(deviceInfo.deviceType.charAt(0).toUpperCase() + deviceInfo.deviceType.slice(1));
  }
  
  if (deviceInfo.os) {
    const osStr = deviceInfo.osVersion 
      ? `${deviceInfo.os} ${deviceInfo.osVersion}`
      : deviceInfo.os;
    parts.push(osStr);
  }
  
  if (deviceInfo.browser) {
    const browserStr = deviceInfo.browserVersion
      ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`
      : deviceInfo.browser;
    parts.push(browserStr);
  }
  
  if (deviceInfo.device) {
    parts.push(deviceInfo.device);
  }
  
  const formatted = parts.join(' / ');
  return formatted;
};

/**
 * Format location information for display
 */
export const formatLocation = (geo) => {
  if (!geo) {
    return 'Unknown Location';
  }
  
  const parts = [];
  
  if (geo.city) parts.push(geo.city);
  if (geo.region && geo.region !== geo.city) {
    parts.push(geo.region);
  }
  if (geo.country) {
    parts.push(geo.country);
  }
  
  const formatted = parts.filter(Boolean).join(', ') || 'Unknown Location';
  
  return formatted;
};

/**
 * Format timestamp for display in user's local timezone
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  
  // Format in user's local timezone
  const dateStr = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
  
  const fullDateTime = `${dateStr} ${timeStr}`;
  
  return {
    date: dateStr,
    time: timeStr,
    fullDateTime: fullDateTime
  };
};

export default {
  getScansByPeriod,
  getScanDetails,
  formatDeviceInfo,
  formatLocation,
  formatTimestamp
};
