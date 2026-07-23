import { apiRequest } from '../api/httpClient'
export const getInventoryComparison = () => apiRequest('/dashboard/inventory-comparison')
