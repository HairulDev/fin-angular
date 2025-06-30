import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { getCachedOrFetch } from '../../../utils/cacheUtils';
import { environment } from '../../../environments/env';
import { getFromLocalStorage } from '../../../utils/storageUtils';
import ModalSearchPortfolioComponent from '../../components/modal-search-portfolio/index.page';
import PortfolioSectionComponent from '../../components/portfolio-section/index.page';
import SummarySectionComponent from '../../components/summary-section/index.page';
import PortfolioService from '../../services/portfolio/index.page';
import StockService from '../../services/stock/index.page';
import PortfolioStoreService from '../../stores/portfolio/index.page';


const STORAGE_KEY = "totalPortfolios";

interface PortfolioItem {
  id: number;
  symbol: string;
  companyName: string;
  purchase: number;
  lastDiv: number;
  industry: string;
  marketCap: number;
  comments: string[];
  portfolios: any[];
  price?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ModalSearchPortfolioComponent,
    PortfolioSectionComponent,
    SummarySectionComponent
  ],
  templateUrl: './index.page.html',
})
export default class DashboardComponent implements OnInit {
  token = localStorage.getItem('token');
  totalValueOld = signal(getFromLocalStorage(STORAGE_KEY) || 0);


  constructor(
    public portfolioStore: PortfolioStoreService,
    private portfolioService: PortfolioService,
    private stockService: StockService,
  ) {}

  totalGain = computed(() => {
    const totalValue = this.portfolioStore.totalValue();
    const oldValue = this.totalValueOld();
    return oldValue === 0 ? 0 : Math.ceil(totalValue - oldValue);
  });

  isNotesModalOpen = false;
  selectedNoteItem?: PortfolioItem;

  // Search-related state
  showSearchSection = false;
  searchQuery = '';
  searchResults: any[] = [];
  searchLoading = false;
  searchError = '';
  showSuggestions = false;

  ngOnInit(): void {
    Chart.register(...registerables);
    this.loadPortfolio().then(() => {
      setTimeout(() => this.createCharts(), 100);
    });
  }

  openNotesModal(item: PortfolioItem) {
    this.selectedNoteItem = item;
    this.isNotesModalOpen = true;
  }

  closeNotesModal() {
    this.isNotesModalOpen = false;
    this.selectedNoteItem = undefined;
  }

  // --- Search and Add Portfolio Methods ---

  toggleSearchSection(show: boolean) {
    this.showSearchSection = show;
    if (!show) {
      this.clearSearch();
    }
  }

  updateSearchQuery(query: string) {
    this.searchQuery = query;
    if (query) {
      this.handleSearch();
    } else {
      this.searchResults = [];
      this.showSuggestions = false;
    }
  }

  async handleSearch() {
    if (!this.searchQuery) return;
    this.searchLoading = true;
    this.searchError = '';
    try {
      this.searchResults = await this.portfolioService.searchStocks(this.searchQuery);
      this.showSuggestions = true;
    } catch (err: any) {
      this.searchError = err.message;
    } finally {
      this.searchLoading = false;
    }
  }

  async handleSelect(item: any) {
    this.searchLoading = true;
    try {
      await this.portfolioService.addToPortfolio(this.token!, item.symbol);
      alert(`${item.symbol} added successfully!`);
      await this.loadPortfolio(); // Refresh portfolio
      this.toggleSearchSection(false); // Close search section
    } catch (err: any) {
      alert(err.message);
    } finally {
      this.searchLoading = false;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchError = '';
    this.showSuggestions = false;
  }

  // --- End Search and Add ---

  async loadPortfolio() {
    this.portfolioStore.portfolio.update(state => ({ ...state, loading: true, error: '' }));

    try {
      const { items, dividends } = await this.portfolioService.loadPortfolio(this.token!);
      this.portfolioStore.portfolio.set({ items, dividends, error: '', loading: false });

      // Create charts after data is successfully loaded
      setTimeout(() => this.createCharts(), 100);

    } catch (err: any) {
      this.portfolioStore.portfolio.update(state => ({ ...state, error: err.message, loading: false }));
    }
  }
  
  
  async deletePortfolio(symbol: string) {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    this.portfolioStore.portfolio.update(state => ({ ...state, loading: true }));

    try {
      await this.portfolioService.deletePortfolio(this.token!, symbol);
      // Reload the portfolio list after deletion
      await this.loadPortfolio();
    } catch (err: any) {
      this.portfolioStore.portfolio.update(state => ({ ...state, error: err.message, loading: false }));
      alert(err.message);
    }
  }

  createCharts() {
    const items = this.portfolioStore.portfolio().items;
    const dividendsMap = this.portfolioStore.portfolio().dividends;

    items.forEach((item:any, index:number) => {
      const canvas = document.getElementById(`chart-${index}`) as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dividends = dividendsMap[item.symbol] || [];
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: dividends.map((item:any) => {
                const dateObj = new Date(item.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const year = dateObj.getFullYear();
                return `${day} ${month} ${year}`;
              }),
              datasets: [
                {
                  data: dividends.map((d:any) => d.dividend),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(241, 21, 21, 0.1)',
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
                    callback: (tickValue: string | number) => {
                      if (typeof tickValue === 'number') {
                        return `$${tickValue.toFixed(2)}`;
                      }
                      return tickValue;
                    },
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
