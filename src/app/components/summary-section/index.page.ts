import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-6 bg-gray-800 p-4 rounded-lg">
      <h2 class="text-lg font-bold mb-2">Summary</h2>
      <p>Total Portfolio Value: <strong>totalValue</strong></p>
      <p>Gain: <strong [class.text-green-400]="totalGain >= 0" [class.text-red-400]="totalGain < 0">
        {{ totalGain >= 0 ? '+' : '' }}totalGain
      </strong></p>
      <p>Stock Count: <strong>{{ stockCount }}</strong></p>
      <button class="mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-400" (click)="openStocksModal()">
        Add Stock
      </button>
    </div>
  `
})
export default class SummarySectionComponent {
  @Input() totalValue = 0;
  @Input() totalGain = 0;
  @Input() stockCount = 0;
  @Input() openStocksModal!: () => void;
}
