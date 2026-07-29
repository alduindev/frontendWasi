export function appointmentDraftFor(date) {
  return {
    patientId: "",
    medicalServiceTypeId: "",
    professionalId: "",
    date,
    time: "09:00",
    reason: "",
    notes: "",
  };
}
