import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { getFromLocalStorage } from '../../../utils/storageUtils';
import ModalSearchPortfolioComponent from '../../components/modal-search-portfolio/index.page';
import PortfolioSectionComponent from '../../components/portfolio-section/index.page';
import SummarySectionComponent from '../../components/summary-section/index.page';
import PortfolioService from '../../services/portfolio/index.page';
import PortfolioStoreService from '../../stores/portfolio/index.page';
import { BalanceSheetStatement, CashFlowStatement, CompanyProfile, IncomeStatement, KeyMetricsTTM, SecFiling } from 'src/app/interfaces/portfolio.model';
import { formatLargeMonetaryNumber,formatLargeNonMonetaryNumber, formatRatio  } from '../../../utils/numberFormatting';
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
  formatLargeMonetaryNumber = formatLargeMonetaryNumber;
  formatLargeNonMonetaryNumber = formatLargeNonMonetaryNumber;
  formatRatio = formatRatio;
  totalValueOld = signal(getFromLocalStorage(STORAGE_KEY) || 0);

  constructor(
    public portfolioStore: PortfolioStoreService,
    private portfolioService: PortfolioService
  ) {
    effect(() => {
      const items = this.portfolioStore.portfolio().items;
      if (items.length > 0) {
        setTimeout(() => this.createCharts(), 100);
      }
    });
  }

  totalGain = computed(() => {
    const totalValue = this.portfolioStore.totalValue();
    const oldValue = this.totalValueOld();
    return oldValue === 0 ? 0 : Math.ceil(totalValue - oldValue);
  });

  isNotesModalOpen = false;
  selectedNoteItem?: PortfolioItem;

  keyMetrics = signal<KeyMetricsTTM | null>(null);
  companyProfile = signal<CompanyProfile | null>(null);
  secFilings = signal<SecFiling[]>([]);
  incomeStatements = signal<IncomeStatement[]>([]);
  cashFlows = signal<CashFlowStatement[]>([]);
  balanceSheet = signal<BalanceSheetStatement | null>(null);
  fullReport = signal<any | null>(null);

  

  ngOnInit(): void {
    Chart.register(...registerables);
    this.portfolioStore.loadPortfolio();
  }
  
  async openNotesModal(item: PortfolioItem) {
    this.selectedNoteItem = item;
    this.isNotesModalOpen = true;
    const symbol = item.symbol;
  
    try {
      const [metrics, profile, filings, incomeStatements, cashFlows, balance] = await Promise.all([
        await this.portfolioService.getKeyMetricsTTM(symbol),
        await this.portfolioService.getCompanyProfile(symbol),
        await this.portfolioService.getSecFilings(symbol),
        await this.portfolioService.getIncomeStatements(symbol),
        await this.portfolioService.getCashFlowStatements(symbol),
        await this.portfolioService.getBalanceSheetStatements(symbol),
      ]);

      this.keyMetrics.set(metrics?.[0] ?? null);
      this.companyProfile.set(profile?.[0] ?? null);
      this.secFilings.set(filings ?? []);
      this.incomeStatements.set(incomeStatements || []);
      this.cashFlows.set(cashFlows || []);
      this.balanceSheet.set(balance?.[0]) ?? null;

      // Gabungkan semua ke satu objek JSON
      this.fullReport.set({
        symbol,
        companyProfile: profile?.[0] ?? null,
        keyMetrics: metrics?.[0] ?? null,
        secFilings: filings ?? [],
        incomeStatements: incomeStatements ?? [],
        cashFlows: cashFlows ?? [],
        balanceSheet: balance?.[0] ?? null,
      });
    } catch (err) {
      console.error('Error loading detail modal:', err);
    }
  }
  copyFullReportToClipboard() {
    const report = this.fullReport();
    if (report) {
      const jsonString = JSON.stringify(report, null, 2); // Pretty print
      navigator.clipboard.writeText(jsonString).then(() => {
        alert('Full report copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  }

  downloadFullReportAsJSON() {
    const report = this.fullReport();
    if (!report) return;
  
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.symbol}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  

  closeNotesModal() {
    this.isNotesModalOpen = false;
    this.selectedNoteItem = undefined;
  }

  async deletePortfolio(symbol: string) {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    this.portfolioStore.portfolio.update(state => ({ ...state, loading: true }));

    try {
      await this.portfolioService.deletePortfolio(symbol);
      await this.portfolioStore.loadPortfolio();
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
                        return `${tickValue.toFixed(2)}`;
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
