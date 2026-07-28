import { apiRequest } from "../api/httpClient";

/**
 * Public catalogue used during onboarding.  The backend remains the source of
 * truth: it can enable, disable or rename a medical service without requiring
 * a frontend deploy.
 */
export function getMedicalServiceTypes() {
  return apiRequest("/medical/service-types");
}
