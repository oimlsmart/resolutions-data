// Display helpers for action / consideration types.
// The parser stores semantic types in snake_case ('having_regard_to',
// 'noting', 'following_recommendation', ...). The UI should show them in
// a humanized form.

const TYPE_LABELS: Record<string, string> = {
  // Considerations
  having_regard_to:         'Having regard to',
  having_regard:            'Having regard',
  noting:                   'Noting',
  recalling:                'Recalling',
  considering:              'Considering',
  following_recommendation: 'Following the recommendation of',
  // Actions
  approves:    'Approves',
  elects:      'Elects',
  endorses:    'Endorses',
  resolves:    'Resolves',
  gives_discharge:     'Gives discharge',
  thanks:      'Thanks',
  instructs:   'Instructs',
  requests:    'Requests',
  decides:     'Decides',
  charges:     'Charges',
  supports:    'Supports',
  reaffirms:   'Re-affirms',
  rescinds:    'Rescinds',
  acknowledges: 'Acknowledges',
  notes:       'Notes',
  welcomes:    'Welcomes',
  renews:      'Renews',
  appoints:    'Appoints',
  establishes: 'Establishes',
  proclaims:   'Proclaims',
  confirms:    'Confirms',
}

export function formatActionType(type: string | undefined | null): string {
  if (!type) return ''
  if (TYPE_LABELS[type]) return TYPE_LABELS[type]
  // Fallback: convert snake_case → Title Case
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
