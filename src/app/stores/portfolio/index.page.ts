import { Injectable, computed, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export default class PortfolioStoreService {
  search = signal({
    query: '',
    results: [] as any[],
    loading: false,
    error: '',
    showSuggestions: false
  });

  portfolio = signal({
    dividends: {} as Record<string, any[]>,
    items: [] as any[],
    error: '',
    loading: false
  });

  notes = signal({
    showModal: false,
    action: '',
    title: '',
    content: '',
    filePaths: [] as string[],
    selectedSymbol: '',
    isDescending: false,
    list: [] as any[],
    selectedFiles: [] as File[],
    isEditing: false,
    editingId: null as number | null
  });

  stocks = signal({
    showModal: false,
    modalStep: 1,
    form: {
      symbol: '',
      companyName: '',
      purchase: '',
      lastDiv: '',
      industry: '',
      marketCap: ''
    },
    search: {
      symbol: '',
      companyName: '',
      sortBy: 'symbol',
      isDescending: false,
      pageNumber: 1,
      pageSize: 5
    },
    list: [] as any[],
    isEditing: false,
    editingId: null as number | null
  });

  preview = signal({
    url: '',
    showModal: false
  });

  // UI
  ui = signal({
    showSearchSection: false
  });

  stockForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.stockForm = this.fb.group({
      symbol: ['', Validators.required],
      companyName: ['', Validators.required],
      purchase: [null, [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      lastDiv: [null, [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      industry: ['', Validators.required],
      marketCap: [null, [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]]
    });
  }

  totalValue = computed(() => {
    return this.portfolio().items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
  });

  resetStockForm() {
    this.stockForm.reset({
      symbol: '',
      companyName: '',
      purchase: '',
      lastDiv: '',
      industry: '',
      marketCap: ''
    });
  }

  setStockFormValues(values: any) {
    this.stockForm.setValue(values);
  }

  get stockErrors() {
    const errors: Record<string, string> = {};
    for (const controlName in this.stockForm.controls) {
      const control = this.stockForm.get(controlName);
      if (control && control.invalid && (control.dirty || control.touched)) {
        const errorKey = Object.keys(control.errors || {})[0];
        if (errorKey === 'required') errors[controlName] = 'This field is required';
        if (errorKey === 'pattern') errors[controlName] = 'Must be a number';
      }
    }
    return errors;
  }

  handleStockSubmit(callback: (values: any) => void) {
    return () => {
      if (this.stockForm.valid) {
        callback(this.stockForm.value);
      } else {
        this.stockForm.markAllAsTouched();
      }
    };
  }
}
