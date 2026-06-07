// Feature flags — can be toggled via /admin/settings/features
// Add new features here; disabled by default until ready

export const FEATURE_FLAGS = {
  // Email notifications via Resend
  email_notifications: false,

  // QR code labels on tickets
  qr_labels: false,

  // Excel export for reports
  excel_export: true,

  // PDF export for cards and reports
  pdf_export: true,

  // In-app notifications
  notifications: true,

  // Global search (Cmd+K)
  global_search: true,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key] ?? false;
}
