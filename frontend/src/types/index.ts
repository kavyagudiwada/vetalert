export type UserRole =
  | 'farmer'
  | 'veterinarian'
  | 'government_official'
  | 'hospital_admin'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
  avatar?: string
  village?: string
  block?: string
  district?: string
  state?: string
  createdAt: string
}

export type Species =
  | 'cattle'
  | 'buffalo'
  | 'goat'
  | 'sheep'
  | 'pig'
  | 'poultry'
  | 'horse'
  | 'camel'

export type Sex = 'male' | 'female'

export interface GeoLocation {
  latitude: number
  longitude: number
  address?: string
}

export interface Animal {
  id: string
  tagId: string
  registrationNumber: string
  name?: string
  species: Species
  breed: string
  sex: Sex
  ageYears: number
  ageMonths?: number
  weightKg?: number
  ownerId: string
  ownerName: string
  location: GeoLocation
  village: string
  block: string
  district: string
  state: string
  healthStatus?: string
  createdAt: string
  photoUrl?: string
}

export type ReportStatus =
  | 'reported'
  | 'triaged'
  | 'confirmed'
  | 'resolved'
  | 'under_investigation'
  | 'closed'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface TriageResult {
  riskLevel: SeverityLevel
  confidenceScore: number
  suspectedDiseases: { diseaseId: string; name: string; probability: number }[]
  recommendedActions: string[]
  urgency: 'immediate' | 'urgent' | 'routine'
  note?: string
}

export interface StatusEntry {
  status: ReportStatus
  timestamp: string
  updatedBy?: string
  note?: string
}

export interface SymptomReport {
  id: string
  animalId?: string
  animal?: Animal
  reporterId: string
  species: Species
  symptoms: string[]
  description: string
  photos?: string[]
  location: GeoLocation
  village: string
  block: string
  district: string
  state: string
  status: ReportStatus
  severity: SeverityLevel
  triageResult?: TriageResult
  statusHistory: StatusEntry[]
  relatedOutbreakId?: string
  createdAt: string
  updatedAt: string
}

export interface Disease {
  id: string
  name: string
  scientificName: string
  description: string
  symptoms: string[]
  speciesAffected: Species[]
  severity: SeverityLevel
  zoonotic: boolean
  contagious: boolean
  prevention: string[]
  treatment: string[]
  riskFactors: string[]
  imageUrl?: string
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: SeverityLevel
  location: GeoLocation
  affectedArea: string
  radiusKm: number
  broadcastTo: UserRole[]
  diseaseId?: string
  status: 'active' | 'expired'
  createdBy: string
  createdAt: string
  expiresAt?: string
}

export interface Vaccination {
  id: string
  animalId: string
  vaccineName: string
  vaccineType: string
  batchNumber: string
  doseNumber: number
  administeredBy: string
  administeredOn: string
  nextDueOn: string
  notes?: string
}

export type LabSampleStatus =
  | 'collected'
  | 'received'
  | 'testing'
  | 'ready'
  | 'disposed'

export interface LabSample {
  id: string
  sampleId: string
  reportId?: string
  animalId?: string
  sampleType: string
  collectedOn: string
  collectedAt: GeoLocation
  testedFor: string
  status: LabSampleStatus
  result?: string
  labName?: string
  notes?: string
}

export type OutbreakStatus =
  | 'active'
  | 'contained'
  | 'controlled'
  | 'resolved'

export interface Outbreak {
  id: string
  diseaseId: string
  diseaseName: string
  status: OutbreakStatus
  location: GeoLocation
  radiusKm: number
  confirmedCases: number
  activeCases: number
  deaths: number
  atRiskAnimals: number
  speciesAffected: Species[]
  declaredOn: string
  controlledOn?: string
  resolvedOn?: string
  controlMeasures: string[]
  createdAt: string
}

export interface DashboardStats {
  totalAnimals: number
  totalReports: number
  activeReports: number
  activeOutbreaks: number
  confirmedOutbreaks: number
  vaccinationCoverage: number
  vaccinatedAnimals: number
  criticalCases: number
  labSamplesTesting: number
  livestockPopulation?: number
  fmdVaccinationDoses?: number
  fmdFarmersBenefited?: number
  fmdDistrictsCovered?: number
  surveillanceRecords?: number
}

export interface WeatherRisk {
  district: string
  riskLevel: SeverityLevel
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  correlatedDiseases: { diseaseId: string; name: string; correlation: number }[]
  advice: string[]
  updatedAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
