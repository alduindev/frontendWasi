export function medicalClinicalPermissions(capabilities, administrator = false) {
  const has = (permission) => administrator || capabilities?.has(permission);
  const manageWithCreate = (permission) => has(permission);

  return {
    attachmentDelete: administrator,
    attachmentUpload: has("health.patients.edit"),
    create: {
      diagnosis: manageWithCreate("health.diagnoses.create"),
      order: manageWithCreate("health.orders.create"),
      prescription: manageWithCreate("health.prescriptions.create"),
      record: has("health.records.create"),
      result: manageWithCreate("health.results.create"),
    },
    edit: {
      diagnosis: manageWithCreate("health.diagnoses.create"),
      order: manageWithCreate("health.orders.create"),
      prescription: manageWithCreate("health.prescriptions.create"),
      record: has("health.records.edit"),
      result: manageWithCreate("health.results.create"),
    },
  };
}
