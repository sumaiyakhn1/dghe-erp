import axios from 'axios';

const API_BASE_URL = 'https://admission-api.odpay.in';
const ERP_API_URL = 'https://others-api.odpay.in/api/add/student';

export interface LoginResponse {
  authorization: string;
  // ... other fields if needed
}

export const login = async (mobile: string, password: string): Promise<string> => {
  try {
    const response = await axios.post<any>(`${API_BASE_URL}/login`, {
      mobile,
      password,
    });
    
    // Try to find token in data or headers
    const data = response.data;
    const headers = response.headers;
    
    let token = 
      data.authorization || 
      data.Authorization || 
      (data.data && data.data.authorization) ||
      (data.data && data.data.token) ||
      data.token || 
      headers['authorization'] || 
      headers['Authorization'] ||
      (typeof data === 'string' && data.startsWith('ey') ? data : null);
    
    if (token && typeof token === 'string') {
      token = token.trim();
      
      localStorage.setItem('erp_auth_token', token);
      return token;
    }
    
    const dataKeys = typeof data === 'object' ? Object.keys(data).join(', ') : typeof data;
    throw new Error(`Auth Success (200) but no token found. Received keys: [${dataKeys}]. Check console for details.`);
  } catch (error: any) {
    console.error('Login error details:', error);
    
    if (error.response?.data?.message) {
      throw error.response.data.message;
    }
    
    if (error.message) {
      throw error.message;
    }

    throw 'Authentication failed. Please check credentials or network.';
  }
};

export const getAuthToken = () => localStorage.getItem('erp_auth_token');

export const logout = () => {
  localStorage.removeItem('erp_auth_token');
};

export const addStudent = async (payload: any) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return axios.post(ERP_API_URL, payload, {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    }
  });
};

export const getCourses = async (entity: string, session: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return axios.get(`https://others-api.odpay.in/api/list/course`, {
    params: { entity, session, isLEET: true },
    headers: { 'Authorization': token }
  });
};
