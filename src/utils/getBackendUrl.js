// Clean Frontend Utility for API URL Resolution (Mock Mode)

export const getBackendUrl = () => {
  return '';
};

export const getApiUrl = (endpoint = '') => {
  return endpoint;
};

export const fetchWithRetry = async (url, options = {}, maxRetries = 1) => {
  return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));
};
