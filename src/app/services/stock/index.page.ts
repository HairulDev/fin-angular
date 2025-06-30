import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/env';

@Injectable({
  providedIn: 'root'
})
export default 
 class StockService {
  private apiUrl = `${environment.apiUrl}/api/stock`;

  constructor(private http: HttpClient) {}

  loadStocks(state: any, token: string) {
    const search = state.stocks.search;
    const params = new HttpParams()
      .set('Symbol', search.symbol)
      .set('CompanyName', search.companyName)
      .set('SortBy', search.sortBy)
      .set('IsDescending', search.isDescending)
      .set('PageNumber', search.pageNumber)
      .set('PageSize', search.pageSize);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(this.apiUrl, { headers, params })
      .pipe(catchError(err => {
        console.error("Failed to load stocks:", err.error?.message || err.message);
        state.stocks.list = [];
        return of([]);
      }))
      .subscribe(data => {
        state.stocks.list = data || [];
      });
  }

  saveStock(state: any, token: string, values: any) {
    state.portfolio.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(this.apiUrl, values, { headers })
      .pipe(catchError(err => {
        alert(err.error?.message || 'Failed to save stock.');
        return of(null);
      }))
      .subscribe(async () => {
        alert('Stock saved successfully.');
        this.loadStocks(state, token);
        state.stocks.modalStep = 1;
        state.portfolio.loading = false;
      });
  }

  updateStock(state: any, token: string, values: any) {
    state.portfolio.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiUrl}/${state.stocks.editingId}`;

    this.http.put(url, values, { headers })
      .pipe(catchError(err => {
        alert(err.error?.message || 'Failed to update stock.');
        return of(null);
      }))
      .subscribe(() => {
        alert('Stock updated successfully.');
        this.loadStocks(state, token);
        state.stocks.modalStep = 1;
        state.stocks.editingId = null;
        state.stocks.isEditing = false;
        state.portfolio.loading = false;
      });
  }

  startEditingStock(state: any, token: string, stockId: number) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiUrl}/${stockId}`;

    this.http.get<any>(url, { headers })
      .pipe(catchError(err => {
        console.error('Failed to fetch stock:', err);
        alert('Error fetching stock for editing.');
        return of(null);
      }))
      .subscribe(stock => {
        if (!stock) return;

        state.stocks.form = {
          symbol: stock.symbol || '',
          companyName: stock.companyName || '',
          purchase: stock.purchase || '',
          lastDiv: stock.lastDiv || '',
          industry: stock.industry || '',
          marketCap: stock.marketCap || ''
        };

        state.stocks.editingId = stockId;
        state.stocks.isEditing = true;
        state.stocks.modalStep = 2;
      });
  }

  deleteStock(state: any, token: string, stockId: number) {
    if (!confirm('Are you sure you want to delete this stock?')) return;

    state.portfolio.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiUrl}/${stockId}`;

    this.http.delete(url, { headers })
      .pipe(catchError(err => {
        alert(err.error?.message || 'Failed to delete stock.');
        return of(null);
      }))
      .subscribe(() => {
        state.stocks.list = state.stocks.list.filter((item: any) => item.id !== stockId);
        state.portfolio.loading = false;
      });
  }
}
