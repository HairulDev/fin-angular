export function formatLargeMonetaryNumber (number: number): string {
  if (number < 0) {
    return "-" + formatLargeMonetaryNumber(-1 * number);
  }
  if (number < 1000) {
    return "$" + number;
  } else if (number < 1_000_000) {
    return "$" + (number / 1000).toFixed(1) + "K";
  } else if (number < 1_000_000_000) {
    return "$" + (number / 1_000_000).toFixed(1) + "M";
  } else if (number < 1_000_000_000_000) {
    return "$" + (number / 1_000_000_000).toFixed(1) + "B";
  } else if (number < 1_000_000_000_000_000) {
    return "$" + (number / 1_000_000_000_000).toFixed(1) + "T";
  }
  // Fallback jika tidak masuk semua kondisi di atas
  return "$" + number.toString();
};

export function formatLargeNonMonetaryNumber (number: number): string {
  if (number < 0) {
    return "-" + formatLargeNonMonetaryNumber(-1 * number);
  }
  if (number < 1000) {
    return number.toString();
  } else if (number < 1_000_000) {
    return (number / 1000).toFixed(1) + "K";
  } else if (number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(1) + "M";
  } else if (number < 1_000_000_000_000) {
    return (number / 1_000_000_000).toFixed(1) + "B";
  } else if (number < 1_000_000_000_000_000) {
    return (number / 1_000_000_000_000).toFixed(1) + "T";
  }
  // Fallback
  return number.toString();
};

export function formatRatio (ratio: number): string {
  return (Math.round(ratio * 100) / 100).toFixed(2);
};
