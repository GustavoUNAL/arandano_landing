export const MUNDIAL_2026 = {
  name: 'Copa Mundial FIFA 2026',
  hosts: ['Estados Unidos', 'México', 'Canadá'],
  hostCities: 16,
  teams: 48,
  groups: 12,
  groupSize: 4,
  totalMatches: 104,
  groupMatches: 72,
  knockoutMatches: 32,
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  openingMatch: 'México vs Sudáfrica',
  finalVenue: 'MetLife Stadium, Nueva Jersey',
  format: [
    '48 selecciones en 12 grupos de 4 equipos',
    'Los 2 primeros de cada grupo + 8 mejores terceros avanzan',
    'Dieciseisavos → Octavos → Cuartos → Semifinales → Final',
    'Partido por el tercer puesto antes de la gran final',
  ],
  phases: [
    { key: 'GROUP_STAGE', label: 'Fase de grupos', matches: 72 },
    { key: 'LAST_32', label: 'Dieciseisavos', matches: 16 },
    { key: 'LAST_16', label: 'Octavos', matches: 8 },
    { key: 'QUARTER_FINALS', label: 'Cuartos', matches: 4 },
    { key: 'SEMI_FINALS', label: 'Semifinales', matches: 2 },
    { key: 'THIRD_PLACE', label: 'Tercer puesto', matches: 1 },
    { key: 'FINAL', label: 'Final', matches: 1 },
  ],
} as const

export function stageLabel(stage: string): string {
  const found = MUNDIAL_2026.phases.find((p) => p.key === stage)
  return found?.label ?? stage.replace(/_/g, ' ')
}

export function groupLabel(group: string): string {
  return group.replace('GROUP_', 'Grupo ')
}
