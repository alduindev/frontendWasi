import { apiRequest } from '../api/httpClient'
export const getCatalog=(code,{search='',offset=0,limit=50}={})=>apiRequest(`/catalogs/${code}?search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`)
export const createCatalogItem=(code,data)=>apiRequest(`/catalogs/${code}/items`,{method:'POST',body:JSON.stringify(data)})
export const getGlobalCatalog=async(code)=> (await getCatalog(code)).items
export const getBusinessCatalog=async(code)=> (await getCatalog(code)).items
