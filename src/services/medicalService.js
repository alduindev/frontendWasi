import { apiRequest } from "../api/httpClient";

const json = (method, body) => ({ method, body: JSON.stringify(body) });

function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const getMedicalDashboard = () => apiRequest("/medical/dashboard");
export const getMedicalServiceTypes = () => apiRequest("/medical/service-types");
export const getBusinessMedicalServices = () =>
  apiRequest("/medical/business-services");
export const getMedicalProfessionals = () => apiRequest("/medical/professionals");
export const createMedicalProfessionalProfile = (data) =>
  apiRequest("/medical/professionals", json("POST", data));
export const updateMedicalProfessionalProfile = (userId, data) =>
  apiRequest(`/medical/professionals/${userId}`, json("PUT", data));
export const getMedicalPatients = (filters = {}) =>
  apiRequest(`/medical/patients${queryString(filters)}`);
export const getMedicalPatientDuplicates = () =>
  apiRequest("/medical/patients/duplicates");
export const createMedicalPatient = (data) =>
  apiRequest("/medical/patients", json("POST", data));
export const updateMedicalPatient = (id, data) =>
  apiRequest(`/medical/patients/${id}`, json("PATCH", data));
export const deactivateMedicalPatient = (id) =>
  apiRequest(`/medical/patients/${id}`, { method: "DELETE" });
export const restoreMedicalPatient = (id) =>
  apiRequest(`/medical/patients/${id}/restore`, { method: "POST" });
export const mergeMedicalPatient = (sourceId, targetPatientId) =>
  apiRequest(
    `/medical/patients/${sourceId}/merge`,
    json("POST", { targetPatientId }),
  );
export const getMedicalAppointments = (filters = {}) =>
  apiRequest(`/medical/appointments${queryString(filters)}`);
export const createMedicalAppointment = (data) =>
  apiRequest("/medical/appointments", json("POST", data));
export const updateMedicalAppointment = (id, data) =>
  apiRequest(`/medical/appointments/${id}`, json("PATCH", data));
export const getMedicalRecords = (patientId) =>
  apiRequest(`/medical/patients/${patientId}/records`);
export const createMedicalRecord = (data) =>
  apiRequest("/medical/records", json("POST", data));
export const createMedicalDiagnosis = (data) =>
  apiRequest("/medical/diagnoses", json("POST", data));
export const createMedicalPrescription = (data) =>
  apiRequest("/medical/prescriptions", json("POST", data));
export const createMedicalOrder = (data) =>
  apiRequest("/medical/orders", json("POST", data));
export const createMedicalResult = (data) =>
  apiRequest("/medical/results", json("POST", data));