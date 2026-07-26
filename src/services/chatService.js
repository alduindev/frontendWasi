import { apiRequest } from '../api/httpClient'
import { getAccessToken } from '../api/authToken'
import { API_URL } from '../config/environment'
export const getMessages=()=>apiRequest('/chat/messages?limit=100')
export const chatSocketUrl=()=>{const url=new URL(`${API_URL}/chat/ws`,location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';const token=getAccessToken();if(token)url.searchParams.set('token',token);return url.toString()}
