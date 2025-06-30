import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, lastValueFrom, of } from 'rxjs';
import { environment } from '../../../environments/env';
import { getCachedOrFetch } from '../../../utils/cacheUtils';

@Injectable({
  providedIn: 'root'
})
export default class PortfolioService {
  private portfolioApi = `${environment.apiUrl}/api/portfolio`;
  private fmpApi = `${environment.apiFmp}/api/v3`;

  constructor(private http: HttpClient) {}

  async searchStocks(query: string): Promise<any[]> {
    if (!query) return [];

    try {
      const data = await getCachedOrFetch(
        'searchCache',
        query,
        async () => {
          const url = `${this.fmpApi}/search?query=${query}&limit=100&apikey=${environment.apiKey}`;
          const res = await lastValueFrom(this.http.get<any[]>(url));
          return res;
        },
        5 * 60 * 60 * 1000
      );
      return data;
    } catch (err: any) {
      throw new Error(err?.error?.message || 'An error occurred during stock search');
    }
  }

  async loadPortfolio(token: string): Promise<{ items: any[], dividends: Record<string, any[]> }> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.portfolioApi}`;

    try {
      const items = await lastValueFrom(this.http.get<any[]>(url, { headers }));
      const dividends: Record<string, any[]> = {};

      await Promise.all(
        items.map(async (item: any) => {
          try {
            const profile = await getCachedOrFetch(
              'companyProfileCache',
              item.symbol,
              () => this.getProfile(item.symbol),
              5 * 60 * 60 * 1000
            );
            item.price = profile.price || item.purchase;
          } catch {
            item.price = item.purchase;
          }

          try {
            const dividendData = await getCachedOrFetch(
              'dividendCache',
              item.symbol,
              () => this.getDividends(item.symbol),
              5 * 60 * 60 * 1000
            );
            dividends[item.symbol] = dividendData;
          } catch {
            dividends[item.symbol] = [];
          }
        })
      );

      return { items, dividends };
    } catch (err: any) {
      throw new Error(err?.error?.message || 'Failed to load portfolio from service');
    }
  }

  async addToPortfolio(token: string, symbol: string): Promise<void> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.portfolioApi}/?symbol=${encodeURIComponent(symbol)}`;

    try {
      await lastValueFrom(this.http.post(url, {}, { headers }));
    } catch (err: any) {
      throw new Error(err?.error?.message || 'Failed to add to portfolio');
    }
  }

  async deletePortfolio(token: string, symbol: string): Promise<void> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.portfolioApi}/?symbol=${encodeURIComponent(symbol)}`;

    try {
      await lastValueFrom(this.http.delete(url, { headers }));
    } catch (err: any) {
      throw new Error(err?.error?.message || 'Failed to delete portfolio');
    }
  }

  async getDividends(symbol: string): Promise<any[]> {
    try {
      const res = await lastValueFrom(this.http.get<any>(
        `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(symbol)}?apikey=${environment.apiKey}`
      ));
      return res?.historical
        ?.slice(0, 18)
        ?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
    } catch (err) {
      console.error(`Failed to get dividends for ${symbol}`, err);
      return [];
    }
  }
  
  async getProfile(symbol: string): Promise<any> {
    try {
      const res = await lastValueFrom(this.http.get<any[]>(
        `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${environment.apiKey}`
      ));
      return res?.[0] || {};
    } catch (err) {
      console.error(`Failed to get profile for ${symbol}`, err);
      return {};
    }
  }
  

  
}
