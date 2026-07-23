import { apiRequest } from '../api/httpClient'
export const getAppBootstrap = () => apiRequest('/app/bootstrap')
