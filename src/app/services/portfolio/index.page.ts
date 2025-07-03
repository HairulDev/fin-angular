// PortfolioService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/env';
import { getCachedOrFetch } from '../../../utils/cacheUtils';
import { CompanyProfile, KeyMetricsTTM, SecFiling } from 'src/app/interfaces/portfolio.model';

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
          return await lastValueFrom(this.http.get<any[]>(url));
        }
      );
      return data;
    } catch (err: any) {
      throw new Error(err?.error?.message || 'An error occurred during stock search');
    }
  }

  async loadPortfolio(): Promise<{ items: any[], dividends: Record<string, any[]> }> {
    const url = this.portfolioApi;

    try {
      const items = await lastValueFrom(this.http.get<any[]>(url));
      const dividends: Record<string, any[]> = {};

      await Promise.all(
        items.map(async (item: any) => {
          try {
            const profile = await getCachedOrFetch(
              'companyProfileCache',
              item.symbol,
              () => this.getProfile(item.symbol)
            );
            item.price = profile.price || item.purchase;
          } catch {
            item.price = item.purchase;
          }

          try {
            const dividendData = await getCachedOrFetch(
              'dividendCache',
              item.symbol,
              () => this.getDividends(item.symbol)
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

  async addToPortfolio(symbol: string): Promise<void> {
    const url = `${this.portfolioApi}/?symbol=${encodeURIComponent(symbol)}`;
    await lastValueFrom(this.http.post(url, {}));
  }

  async deletePortfolio(symbol: string): Promise<void> {
    const url = `${this.portfolioApi}/?symbol=${encodeURIComponent(symbol)}`;
    await lastValueFrom(this.http.delete(url));
  }

  async getDividends(symbol: string): Promise<any[]> {
    const url = `${this.fmpApi}/historical-price-full/stock_dividend/${encodeURIComponent(symbol)}?apikey=${environment.apiKey}`;
    try {
      const res = await lastValueFrom(this.http.get<any>(url));
      return res?.historical
        ?.slice(0, 18)
        ?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
    } catch (err) {
      console.error(`Failed to get dividends for ${symbol}`, err);
      return [];
    }
  }

  async getProfile(symbol: string): Promise<any> {
    const url = `${this.fmpApi}/profile/${encodeURIComponent(symbol)}?apikey=${environment.apiKey}`;
    const res = await lastValueFrom(this.http.get<any[]>(url));
    return res?.[0] || {};
  }

  async getKeyMetricsTTM(symbol: string): Promise<KeyMetricsTTM[]> {
    return await getCachedOrFetch(
      'keyMetricsCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/key-metrics-ttm/${symbol}?limit=1&apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<KeyMetricsTTM[]>(url));
      }
    );
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile[]> {
    return await getCachedOrFetch(
      'companyProfileArrayCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/profile/${symbol}?apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<CompanyProfile[]>(url));
      }
    );
  }

  async getSecFilings(symbol: string): Promise<SecFiling[]> {
    return await getCachedOrFetch(
      'secFilingsCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/sec_filings/${symbol}?type=10-K&page=0&apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<SecFiling[]>(url));
      }
    );
  }

  async getIncomeStatements(symbol: string): Promise<any[]> {
    return await getCachedOrFetch(
      'incomeStatementsCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/income-statement/${symbol}?limit=2&apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<any[]>(url));
      }
    );
  }

  async getCashFlowStatements(symbol: string): Promise<any[]> {
    return await getCachedOrFetch(
      'cashFlowStatementsCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/cash-flow-statement/${symbol}?limit=2&apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<any[]>(url));
      }
    );
  }

  async getBalanceSheetStatements(symbol: string): Promise<any[]> {
    return await getCachedOrFetch(
      'balanceSheetStatementsCache',
      symbol,
      async () => {
        const url = `${this.fmpApi}/balance-sheet-statement/${symbol}?limit=1&apikey=${environment.apiKey}`;
        return await lastValueFrom(this.http.get<any[]>(url));
      }
    );
  }
}
