import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import ModalSearchPortfolioComponent from '../modal-search-portfolio/index.page';
import PortfolioStoreService from '../../stores/portfolio/index.page';

@Component({
  selector: 'app-portfolio-section',
  standalone: true,
  imports: [CommonModule, ModalSearchPortfolioComponent],
  templateUrl: './index.page.html'
})
export default class PortfolioSectionComponent {
  constructor(public portfolioStore: PortfolioStoreService) {}

  toggleSearchSection() {
    this.portfolioStore.ui.update(state => ({ ...state, showSearchSection: !state.showSearchSection }));
    if (!this.portfolioStore.ui().showSearchSection) {
      this.portfolioStore.clearSearch();
    }
  }

  updateSearchQuery(query: string) {
    this.portfolioStore.updateSearchQuery(query);
  }

  onSearch() {
    this.portfolioStore.handleSearch();
  }

  onClear() {
    this.portfolioStore.clearSearch();
  }

  onSelect(item: any) {
    this.portfolioStore.handleSelect(item);
  }
}
