// Mantido apenas por compatibilidade se você ainda importar este arquivo em algum lugar.
// O app agora usa a camada `src/services/*` e React Query.
export function getApiUrl() {
  return import.meta.env.VITE_API_URL;
}
