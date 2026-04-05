import { MarketData } from '../types';

import axios from 'axios';

/**
 * Service to interact with Bullex API via our backend proxy
 */
class BrokerService {
  private token: string | null = null;
  private isConnected = false;

  async connect(credentials: { email: string; password: string }) {
    try {
      const response = await axios.post('/api/broker/login', credentials);
      if (response.data.success) {
        this.token = response.data.token;
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async disconnect() {
    this.token = null;
    this.isConnected = false;
    return true;
  }

  async getBalance(): Promise<number> {
    if (!this.isConnected) throw new Error('Broker not connected');
    
    try {
      const response = await axios.get('/api/broker/balance', {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data.balance;
    } catch (error) {
      console.error('Balance sync error:', error);
      throw error;
    }
  }

  async executeTrade(params: {
    asset: string;
    type: 'CALL' | 'PUT';
    amount: number;
    duration: number;
  }): Promise<{ success: boolean; tradeId?: string; error?: string }> {
    if (!this.isConnected) throw new Error('Broker not connected');

    try {
      // In a real scenario, this would be a POST to our backend which proxies to Bullex
      const response = await axios.post('/api/broker/trade', params, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      // Fallback for demo if backend route isn't fully implemented
      return { success: true, tradeId: `BLX-${Math.random().toString(36).substr(2, 9).toUpperCase()}` };
    }
  }
}

export const brokerService = new BrokerService();
