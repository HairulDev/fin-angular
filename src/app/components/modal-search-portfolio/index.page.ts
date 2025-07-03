import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-search-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.page.html'
})
export default class ModalSearchPortfolioComponent {
  @Input() query = '';
  @Input() results: any[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Input() showSuggestions = false;

  @Output() updateQuery = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  onInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (input?.value != null) {
      this.updateQuery.emit(input.value);
    }
  }
}
