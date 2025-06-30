import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import ModalSearchPortfolioComponent from '../modal-search-portfolio/index.page';

@Component({
  selector: 'app-portfolio-section',
  standalone: true,
  imports: [CommonModule, ModalSearchPortfolioComponent],
  template: `
    <div class="mb-4">
      <button
        (click)="toggleSearchSection()"
        class="px-3 py-1 mb-2 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center gap-2"
      >
        <span>＋</span> Portfolio
      </button>

      <app-modal-search-portfolio
        *ngIf="showSearchSection"
        [query]="searchQuery"
        [results]="searchResults"
        [loading]="searchLoading"
        [error]="searchError"
        [showSuggestions]="showSuggestions"
        (updateQuery)="updateSearchQueryHandler($event)"
        (search)="onSearch()"
        (clear)="onClear()"
        (select)="onSelect($event)"
        (close)="showSearchSectionChange.emit(false)"
      />
    </div>
  `
})
export default class PortfolioSectionComponent {
  @Input() showSearchSection = false;
  @Input() searchQuery = '';
  @Input() searchResults: any[] = [];
  @Input() searchLoading = false;
  @Input() searchError = '';
  @Input() showSuggestions = false;

  @Output() showSearchSectionChange = new EventEmitter<boolean>();
  @Output() updateSearchQuery = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() select = new EventEmitter<any>();

  toggleSearchSection() {
    this.showSearchSectionChange.emit(!this.showSearchSection);
  }

  updateSearchQueryHandler(query: string) {
    this.updateSearchQuery.emit(query);
  }

  // Untuk digunakan jika ada input di dalam template
  onInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateSearchQuery.emit(value);
  }

  onSearch() {
    this.search.emit();
  }

  onClear() {
    this.clear.emit();
  }

  onSelect(item: any) {
    this.select.emit(item);
    this.showSearchSectionChange.emit(false);
  }
}
