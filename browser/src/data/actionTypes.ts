export const actionTypeColors: Record<string, { bg: string; text: string }> = {
  // Directives (strong, authoritative)
  resolves:    { bg: '#0061ad', text: '#ffffff' },
  decides:     { bg: '#0061ad', text: '#ffffff' },
  instructs:   { bg: '#1e40af', text: '#ffffff' },
  directs:     { bg: '#1e40af', text: '#ffffff' },
  establishes: { bg: '#0e7490', text: '#ffffff' },

  // Approvals (positive, green)
  approves:    { bg: '#15803d', text: '#ffffff' },
  adopts:      { bg: '#15803d', text: '#ffffff' },
  endorses:    { bg: '#166534', text: '#ffffff' },
  confirms:    { bg: '#166534', text: '#ffffff' },
  accepts:     { bg: '#16a34a', text: '#ffffff' },
  agrees:      { bg: '#16a34a', text: '#ffffff' },
  supports:    { bg: '#15803d', text: '#ffffff' },

  // Recommendations (softer)
  recommends:  { bg: '#7c3aed', text: '#ffffff' },
  encourages:  { bg: '#7c3aed', text: '#ffffff' },
  asks:        { bg: '#6d28d9', text: '#ffffff' },
  requests:    { bg: '#6d28d9', text: '#ffffff' },

  // Appointments (amber)
  appoints:    { bg: '#b45309', text: '#ffffff' },
  nominates:   { bg: '#b45309', text: '#ffffff' },
  assigns:     { bg: '#d97706', text: '#ffffff' },

  // Social (warm)
  thanks:      { bg: '#be185d', text: '#ffffff' },
  welcomes:    { bg: '#db2777', text: '#ffffff' },
  appreciates: { bg: '#9d174d', text: '#ffffff' },

  // Neutral (slate)
  notes:       { bg: '#475569', text: '#ffffff' },
  considers:   { bg: '#475569', text: '#ffffff' },
  acknowledges:{ bg: '#64748b', text: '#ffffff' },
  recognises:  { bg: '#64748b', text: '#ffffff' },
  recognizes:  { bg: '#64748b', text: '#ffffff' },

  // Changes (red/critical)
  disbands:    { bg: '#991b1b', text: '#ffffff' },
  withdraws:   { bg: '#dc2626', text: '#ffffff' },
  replaces:    { bg: '#dc2626', text: '#ffffff' },

  // Default fallback
  _default:    { bg: '#64748b', text: '#ffffff' },
}

export function getActionColor(type: string): { bg: string; text: string } {
  const normalized = type.toLowerCase().trim()
  return actionTypeColors[normalized] || actionTypeColors._default
}
