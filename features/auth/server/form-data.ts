export function formDataToRecord(
  formData: FormData
): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(formData.entries());
}
