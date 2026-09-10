import { apiRequest } from '../api/httpClient'
export const getPlatformDashboard = () => apiRequest('/platform/dashboard')
export const getPlatformBusinesses = (includeArchived = false) => apiRequest(`/platform/businesses${includeArchived ? '?includeArchived=true' : ''}`)
export const setBusinessStatus = (id, status) => apiRequest(`/platform/businesses/${id}/status?status=${status}`, { method: 'POST' })
export const archiveBusiness = (id) => apiRequest(`/platform/businesses/${id}/archive`, { method: 'POST' })
export const restoreBusiness = (id) => apiRequest(`/platform/businesses/${id}/restore`, { method: 'POST' })
export const deleteBusiness = (id) => apiRequest(`/platform/businesses/${id}`, { method: 'DELETE' })
export const getPlatformBusiness = (id) => apiRequest(`/platform/businesses/${id}`)
export const resetPlatformUserPassword = (businessId, userId, reason) => apiRequest(`/platform/businesses/${businessId}/users/${userId}/password-reset`, {
  method: 'POST',
  body: JSON.stringify({ reason }),
  sensitiveResponse: true,
})
export const changeBusinessPlan = (id, plan) => apiRequest(`/platform/businesses/${id}/plan?plan_code=${plan}`, { method: 'POST' })
export const updatePlatformBusinessSubscription = (id, data) => apiRequest(`/platform/businesses/${id}/subscription`, { method: 'PATCH', body: JSON.stringify(data) })
export const changeBusinessType = (id, businessTypeId, medicalServiceIds = []) => apiRequest(`/platform/businesses/${id}/business-type`, { method: 'POST', body: JSON.stringify({ businessTypeId, medicalServiceIds }) })
export const getPlans = () => apiRequest('/plans')
export const getPlatformPlans = () => apiRequest('/platform/plans')
export const createPlatformPlan = (data) => apiRequest('/platform/plans',{method:'POST',body:JSON.stringify(data)})
export const updatePlatformPlan = (id,data) => apiRequest(`/platform/plans/${id}`,{method:'PUT',body:JSON.stringify(data)})
export const getPlatformAddOns = () => apiRequest('/platform/add-ons')
export const createPlatformAddOn = (data) => apiRequest('/platform/add-ons',{method:'POST',body:JSON.stringify(data)})
export const getPlatformCoupons = () => apiRequest('/platform/coupons')
export const createPlatformCoupon = (data) => apiRequest('/platform/coupons',{method:'POST',body:JSON.stringify(data)})
export const getPlatformSubscriptions = () => apiRequest('/platform/subscriptions')
export const getPlatformPayments = () => apiRequest('/platform/payments')
export const getPlatformModules = () => apiRequest('/platform/modules')
export const getIndustryTemplates = () => apiRequest('/platform/industry-templates')
