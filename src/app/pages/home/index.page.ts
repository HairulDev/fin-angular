import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import { getCachedOrFetch } from '../../../utils/cacheUtils';
import { environment } from '../../../environments/env';

interface PortfolioItem {
  id: number;
  symbol: string;
  companyName: string;
  purchase: number;
  lastDiv: number;
  industry: string;
  marketCap: number;
  comments: any[];
  portfolios: any[];
  price?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.page.html',
})
export default class DashboardComponent implements OnInit {
  portfolioState = {
    loading: false,
    error: '',
    items: [] as PortfolioItem[],
    dividends: {} as Record<string, any[]>,
  };

  ngOnInit(): void {
    Chart.register(...registerables);
    const token :any= localStorage.getItem('token');

    this.loadPortfolio(this.portfolioState, token).then(() => {
      setTimeout(() => this.createCharts(), 100);
    });
  }

  async loadPortfolio(state: any, token: string) {
    
    state.loading = true;
    try {
      const response = await axios.get(`${environment.apiUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      state.items = response.data;

      await Promise.all(
        state.items.map(async (item: PortfolioItem) => {
          const symbol = item.symbol;

          try {
            const sortedData = await getCachedOrFetch(
              'dividendCache',
              symbol,
              async () => {
                const res = await axios.get(
                  `${environment.apiFmp}/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(
                    symbol
                  )}?apikey=${environment.apiKey}`
                );
                return (
                  res.data.historical?.slice(0, 18)?.sort(
                    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
                  ) || []
                );
              },
              5 * 60 * 60 * 1000
            );
            state.dividends[symbol] = sortedData;
          } catch {
            state.dividends[symbol] = [];
          }

          try {
            const profile = await getCachedOrFetch(
              'companyProfileCache',
              symbol,
              async () => {
                const res = await axios.get(
                  `${environment.apiFmp}/api/v3/profile/${encodeURIComponent(
                    symbol
                  )}?apikey=${environment.apiKey}`
                );
                return res.data?.[0] || {};
              },
              5 * 60 * 60 * 1000
            );
            item.price = profile.price || item.purchase;
          } catch {
            item.price = item.purchase;
          }
        })
      );
    } catch (err: any) {
      state.error = err.response?.data?.message || 'Failed to load portfolio';
    } finally {
      state.loading = false;
    }
  }

  createCharts() {
    this.portfolioState.items.forEach((item, index) => {
      const canvas = document.getElementById(`chart-${index}`) as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dividends = this.portfolioState.dividends[item.symbol] || [];
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: dividends.map(item => {
                const dateObj = new Date(item.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const year = dateObj.getFullYear();
                return `${day} ${month} ${year}`;
              }),
              datasets: [
                {
                  data: dividends.map((d) => d.dividend),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.1,
                  pointBackgroundColor: '#10b981',
                  pointBorderColor: '#10b981',
                  pointRadius: 3,
                  pointHoverRadius: 5,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { color: '#374151' },
                  ticks: { color: '#9ca3af', font: { size: 10 } },
                },
                y: {
                  position: 'right',
                  grid: { color: '#374151' },
                  ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    callback: (value) => `$${Number(value).toFixed(2)}`,
                  },
                },
              },
              interaction: {
                intersect: false,
                mode: 'index',
              },
            },
          });
        }
      }
    });
  }
}
