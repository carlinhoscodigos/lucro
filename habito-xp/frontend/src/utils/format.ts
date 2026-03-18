export function formatMoney(value: string | number, currency: string = 'BRL') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number.isFinite(n) ? n : 0);
}

export function formatDateISO(dateISO: string) {
  // expects YYYY-MM-DD
  const [y, m, d] = dateISO.split('-').map(Number);
  if (!y || !m || !d) return dateISO;
  return new Intl.DateTimeFormat('pt-BR').format(new Date(Date.UTC(y, m - 1, d)));
}

