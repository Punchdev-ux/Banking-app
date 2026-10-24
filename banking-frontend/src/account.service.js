import axios from 'axios';

const API_BASE_URL = '/api/accounts';

export const accountService = {
  // 1. Read: Fetch all active banking profiles (Renamed from getAllAccounts)
  getAccounts: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },

  // 2. Create: Register a brand new banking ledger profile
  createAccount: async (accountData) => {
    const response = await axios.post(API_BASE_URL, accountData);
    return response.data;
  },

  // 3. Update: Execute a secure asset transfer between separate account profiles
  transferFunds: async (transferPayload) => {
    const response = await axios.put(`${API_BASE_URL}/transfer`, transferPayload);
    return response.data;
  },

  // 4. Read: Pull specific transaction ledger logs for a chosen profile
  getTransactionHistory: async (accountId) => {
    const response = await axios.get(`${API_BASE_URL}/${accountId}/transactions`);
    return response.data;
  },

  // 5. Delete: Execute database close sequence out of system tracking indexes
  deleteAccount: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  // 6. Analytics fetch action
  getSystemAnalytics: async () => {
    const response = await axios.get(`${API_BASE_URL}/summary/analytics`); 
    return response.data;
  },

  approveNewLoan: async (id, amount) => {
    const response = await axios.post(`${API_BASE_URL}/${id}/loans`, { loan_amount: amount });
    return response.data;
  },
};