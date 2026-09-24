import type { Species, SeverityLevel, ReportStatus, LabSampleStatus } from '../types'

export const SPECIES: Record<Species, string> = {
  cattle: 'cattle',
  buffalo: 'buffalo',
  goat: 'goat',
  sheep: 'sheep',
  pig: 'pig',
  poultry: 'poultry',
  horse: 'horse',
  camel: 'camel',
}

export const SPECIES_LIST: Species[] = [
  'cattle',
  'buffalo',
  'goat',
  'sheep',
  'pig',
  'poultry',
  'horse',
  'camel',
]

export const SEVERITY_LEVELS: SeverityLevel[] = [
  'critical',
  'high',
  'medium',
  'low',
]

export const SEVERITY_VALUES: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export const REPORT_STATUSES: ReportStatus[] = [
  'reported',
  'triaged',
  'confirmed',
  'resolved',
  'under_investigation',
  'closed',
]

export const LAB_SAMPLE_STATUSES: LabSampleStatus[] = [
  'collected',
  'received',
  'testing',
  'ready',
  'disposed',
]

export const SYMPTOM_CATEGORIES = [
  { key: 'respiratory', color: '#3b82f6' },
  { key: 'digestive', color: '#f59e0b' },
  { key: 'skin', color: '#10b981' },
  { key: 'neurological', color: '#8b5cf6' },
  { key: 'reproductive', color: '#ec4899' },
  { key: 'general', color: '#6b7280' },
] as const

export const SYMPTOMS: Record<string, string[]> = {
  respiratory: [
    'coughing',
    'nasalDischarge',
    'difficultyBreathing',
  ],
  digestive: [
    'diarrhea',
    'vomiting',
    'lossOfAppetite',
    'bloating',
  ],
  skin: [
    'skinLesions',
    'hairLoss',
    'itching',
    'swelling',
    'ulcerMouth',
  ],
  neurological: [
    'headTilt',
    'seizures',
    'weakness',
    'lethargy',
    'abnormalBehavior',
  ],
  reproductive: [
    'stillbirth',
    'abortion',
    'milkDrop',
  ],
  general: [
    'fever',
    'lameness',
    'drooling',
    'excessiveThirst',
    'weightLoss',
  ],
}

export type VaccineType =
  | 'fmd'
  | 'hs'
  | 'bq'
  | 'ppr'
  | 'antiRabies'
  | 'brucellosis'

export const VACCINE_TYPES: Record<VaccineType, string> = {
  fmd: 'fmdVaccine',
  hs: 'hsVaccine',
  bq: 'bqVaccine',
  ppr: 'pprVaccine',
  antiRabies: 'antiRabies',
  brucellosis: 'brucellosisVaccine',
}

export const VACCINE_LIST: VaccineType[] = [
  'fmd',
  'hs',
  'bq',
  'ppr',
  'antiRabies',
  'brucellosis',
]

export const ROLES = [
  { value: 'farmer', label: 'farmer' },
  { value: 'veterinarian', label: 'veterinarian' },
  { value: 'government_official', label: 'governmentOfficial' },
  { value: 'hospital_admin', label: 'hospitalAdmin' },
] as const

export const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'english' },
  { code: 'hi', flag: '🇮🇳', label: 'hindi' },
  { code: 'mr', flag: '🇮🇳', label: 'marathi' },
  { code: 'te', flag: '🇮🇳', label: 'telugu' },
] as const

export const SAMPLE_TYPES = [
  'blood',
  'serum',
  'tissue',
  'milk',
  'fecal',
  'swab',
] as const
