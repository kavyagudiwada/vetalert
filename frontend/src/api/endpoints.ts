import apiClient from './client'
import type {
  User,
  Animal,
  SymptomReport,
  Disease,
  Alert,
  Vaccination,
  LabSample,
  Outbreak,
  DashboardStats,
  WeatherRisk,
  GeoLocation,
  PaginatedResponse,
  UserRole,
  SeverityLevel,
} from '../types'

type Params = Record<string, unknown>

// ---------- response mappers (backend snake_case -> frontend types) ----------

const ROLE_MAP: Record<string, UserRole> = {
  govt_officer: 'government_official',
  hospital_admin: 'hospital_admin',
  veterinarian: 'veterinarian',
  farmer: 'farmer',
}

function mapUser(u: any): User {
  const parts = (u?.full_name ?? '').split(' ').filter(Boolean)
  return {
    id: String(u?.id ?? ''),
    firstName: parts[0] ?? u?.full_name ?? '',
    lastName: parts.slice(1).join(' ') ?? '',
    email: u?.email ?? '',
    phone: u?.phone ?? '',
    role: ROLE_MAP[u?.role] ?? 'farmer',
    village: u?.village,
    block: u?.block,
    district: u?.district,
    state: u?.state,
    createdAt: u?.created_at ?? '',
  }
}

function mapToken(data: any) {
  return { token: data.access_token, user: mapUser(data.user) }
}

function toLocation(loc: any): GeoLocation {
  if (Array.isArray(loc?.coordinates) && loc.coordinates.length >= 2) {
    return { latitude: loc.coordinates[1], longitude: loc.coordinates[0] }
  }
  if (typeof loc?.latitude === 'number') {
    return { latitude: loc.latitude, longitude: loc.longitude }
  }
  return { latitude: 0, longitude: 0 }
}

function toPoint(loc?: GeoLocation | null) {
  if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return undefined
  return { type: 'Point', coordinates: [loc.longitude, loc.latitude] }
}

function toSpecies(s: string): Animal['species'] & Disease['speciesAffected'][number] {
  return (s || 'other') as Animal['species']
}

function mapAnimal(a: any): Animal {
  const dob = a?.date_of_birth ? new Date(a.date_of_birth) : null
  const ageYears = dob
    ? Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)))
    : 0
  return {
    id: String(a.id),
    tagId: a.tag_number,
    registrationNumber: a.tag_number,
    name: a.name,
    species: toSpecies(a.species),
    breed: a.breed ?? '',
    sex: a.gender ?? 'female',
    ageYears,
    ownerId: String(a.owner_id ?? ''),
    ownerName: '',
    location: toLocation(a.location),
    village: a.village ?? '',
    block: a.block ?? '',
    district: a.district ?? '',
    state: a.state ?? '',
    createdAt: a.created_at ?? '',
  }
}

function toSeverity(s: string): SeverityLevel {
  return (['critical', 'high', 'medium', 'low'].includes(s) ? s : 'medium') as SeverityLevel
}

function mapReport(r: any): SymptomReport {
  return {
    id: String(r.id),
    animalId: r.animal_id ? String(r.animal_id) : undefined,
    reporterId: String(r.reporter_id ?? ''),
    species: toSpecies(r.animal_species),
    symptoms: r.symptoms ?? [],
    description: r.description ?? '',
    photos: r.images ?? [],
    location: toLocation(r.location),
    village: r.village ?? '',
    block: '',
    district: r.district ?? '',
    state: '',
    status: r.status ?? 'triaged',
    severity: toSeverity(r.severity),
    triageResult: r.triage_result
      ? {
          riskLevel: toSeverity(r.triage_result.report_severity ?? r.severity),
          confidenceScore: r.triage_result.risk_score ?? 0,
          suspectedDiseases: (r.triage_result.suspected_diseases ?? []).map((d: any) => ({
            diseaseId: String(d.disease_id ?? d.code ?? ''),
            name: d.disease_name ?? d.name ?? '',
            probability: d.probability ?? 0,
          })),
          recommendedActions: Array.isArray(r.triage_result.recommended_action)
            ? r.triage_result.recommended_action
            : r.triage_result.recommended_action
              ? [r.triage_result.recommended_action]
              : [],
          urgency: (r.triage_result.urgency_level ?? 'routine').toLowerCase() as 'immediate' | 'urgent' | 'routine',
        }
      : undefined,
    statusHistory: [],
    createdAt: r.created_at ?? '',
    updatedAt: r.updated_at ?? '',
  }
}

function mapDisease(d: any): Disease {
  return {
    id: String(d.id),
    name: d.name,
    scientificName: '',
    description: d.transmission_mode ?? '',
    symptoms: d.symptoms ?? [],
    speciesAffected: (d.species_affected ?? []).map(toSpecies),
    severity: toSeverity(d.severity),
    zoonotic: d.is_zoonotic ?? false,
    contagious: false,
    prevention: d.prevention_guidelines ? d.prevention_guidelines.split('. ').filter(Boolean) : [],
    treatment: d.treatment_protocol ? d.treatment_protocol.split('. ').filter(Boolean) : [],
    riskFactors: [],
    imageUrl: d.image_urls?.[0],
  }
}

function mapAlert(a: any): Alert {
  return {
    id: String(a.id),
    title: a.title ?? '',
    message: a.message ?? '',
    severity: toSeverity(a.severity),
    location: toLocation(a.location),
    affectedArea: a.district ?? a.affected_area ?? '',
    radiusKm: typeof a.radius_km === 'number' ? a.radius_km : 20,
    broadcastTo: [],
    diseaseId: a.disease_id ? String(a.disease_id) : undefined,
    status: a.is_active === false ? 'expired' : 'active',
    createdBy: a.created_by ? String(a.created_by) : '',
    createdAt: a.created_at ?? '',
    expiresAt: a.expires_at,
  }
}

function mapVaccination(v: any): Vaccination {
  return {
    id: String(v.id),
    animalId: String(v.animal_id ?? ''),
    vaccineName: v.vaccine_name ?? '',
    vaccineType: '',
    batchNumber: '',
    doseNumber: v.dose_number ?? 1,
    administeredBy: v.administered_by ? String(v.administered_by) : '',
    administeredOn: v.date_administered ?? '',
    nextDueOn: v.next_due_date ?? '',
    notes: v.status ?? '',
  }
}

function mapLabSample(s: any): LabSample {
  return {
    id: String(s.id),
    sampleId: s.sample_id ?? String(s.id),
    reportId: s.symptom_report_id ? String(s.symptom_report_id) : undefined,
    sampleType: s.sample_type ?? '',
    collectedOn: s.collection_date ?? '',
    collectedAt: { latitude: 0, longitude: 0 },
    testedFor: s.test_name ?? '',
    status: (['collected', 'received', 'testing', 'ready', 'disposed'].includes(s.status) ? s.status : 'collected') as LabSample['status'],
    result: s.result,
    labName: s.lab_id,
  }
}

function mapOutbreak(o: any): Outbreak {
  const status = (s: string) =>
    s === 'suspected' || s === 'confirmed' ? ('active' as const) : (o.status ?? ('active' as const))
  return {
    id: String(o.id),
    diseaseId: String(o.disease_id ?? ''),
    diseaseName: '',
    status: status(o.status),
    location: toLocation(o.location),
    radiusKm: 10,
    confirmedCases: o.confirmed_cases ?? 0,
    activeCases: o.affected_animal_count ?? 0,
    deaths: o.deaths ?? 0,
    atRiskAnimals: o.affected_animal_count ?? 0,
    speciesAffected: [] as Outbreak['speciesAffected'],
    declaredOn: o.start_date ?? o.created_at ?? '',
    controlMeasures: [] as string[],
    createdAt: o.created_at ?? '',
  }
}

function paginate<T>(items: T[], total = items.length): PaginatedResponse<T> {
  return { items, total, page: 1, pageSize: items.length || 1, totalPages: Math.max(1, Math.ceil(total / (items.length || 1))) }
}

function mapDashboardStats(d: any): DashboardStats {
  return {
    totalAnimals: d?.total_animals ?? 0,
    totalReports: d?.total_reports ?? 0,
    activeReports: d?.open_reports ?? 0,
    activeOutbreaks: d?.active_outbreaks ?? 0,
    confirmedOutbreaks: d?.active_outbreaks ?? 0,
    vaccinationCoverage: d?.vaccination_coverage ?? 0,
    vaccinatedAnimals: d?.total_vaccinations ?? 0,
    criticalCases: 0,
    labSamplesTesting: 0,
    livestockPopulation: d?.livestock_population ?? 0,
    fmdVaccinationDoses: d?.fmd_vaccination_doses ?? 0,
    fmdFarmersBenefited: d?.fmd_farmers_benefited ?? 0,
    fmdDistrictsCovered: d?.fmd_districts_covered ?? 0,
    surveillanceRecords: d?.surveillance_records ?? 0,
  }
}

// ---------- API groups ----------

export const authApi = {
  login: (data: { emailOrPhone: string; password: string }) =>
    apiClient
      .post<{ token: string; user: User }>('/auth/login', {
        identifier: data.emailOrPhone,
        password: data.password,
      })
      .then((res) => ({ ...res, data: mapToken(res.data) })),
  register: (data: Record<string, any>) =>
    apiClient
      .post('/auth/register', {
        email: data.email || undefined,
        phone: data.phone || data.mobilePhone || '9000000000',
        full_name:
          data.fullName ||
          `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() ||
          'New User',
        password: data.password,
        role: data.role === 'government_official' ? 'govt_officer' : data.role,
        language_preference: data.languagePreference || data.language || 'en',
      })
      .then((res) => ({ ...res, data: mapToken(res.data) })),
  google: (credential: string, role: string) =>
    apiClient
      .post('/auth/google', { credential, role })
      .then((res) => ({ ...res, data: mapToken(res.data) })),
  profile: () =>
    apiClient.get('/auth/me').then((res) => ({ ...res, data: mapUser(res.data) })),
}

export const animalsApi = {
  list: (params?: Params) =>
    apiClient
      .get<{ total: number; items: Animal[] }>('/animals', {
        params: { limit: params?.pageSize ?? params?.limit ?? 100, skip: params?.page ?? 0 },
      })
      .then((res) => ({ ...res, data: paginate((res.data.items ?? []).map(mapAnimal), res.data.total) })),
  get: (id: string) =>
    apiClient.get(`/animals/${id}`).then((res) => ({ ...res, data: mapAnimal(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/animals', {
        tag_number: data.tag_number ?? data.tagId ?? data.registrationNumber,
        name: data.name,
        species: data.species,
        breed: data.breed,
        gender: data.gender ?? data.sex,
        date_of_birth: data.date_of_birth ?? data.dateOfBirth,
        color: data.color,
        owner_id: data.owner_id ?? (data.ownerId ? Number(data.ownerId) : undefined),
        location: data.location ?? toPoint(data.location),
      })
      .then((res) => ({ ...res, data: mapAnimal(res.data) })),
  update: (id: string, data: Partial<Animal>) =>
    apiClient.put(`/animals/${id}`, { ...data }).then((res) => ({ ...res, data: mapAnimal(res.data) })),
  delete: (id: string) => apiClient.delete(`/animals/${id}`),
}

export const symptomReportsApi = {
  list: (params?: Params) =>
    apiClient
      .get<{ total: number; items: SymptomReport[] }>('/symptom-reports', {
        params: {
          limit: params?.pageSize ?? params?.limit ?? 100,
          skip: params?.page ?? 0,
          status: params?.status,
          district: params?.district,
          species: params?.species,
        },
      })
      .then((res) => ({ ...res, data: paginate((res.data.items ?? []).map(mapReport), res.data.total) })),
  get: (id: string) => apiClient.get(`/symptom-reports/${id}`).then((res) => ({ ...res, data: mapReport(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/symptom-reports', {
        animal_id: data.animalId ? Number(data.animalId) : undefined,
        animal_species: data.species ?? data.animalSpecies,
        symptoms: data.symptoms,
        description: data.description,
        severity: data.severity,
        location: data.location ? { type: 'Point', coordinates: [data.location.longitude, data.location.latitude] } : undefined,
        village: data.village,
        district: data.district,
        images: data.photos ?? data.images ?? [],
      })
      .then((res) => ({ ...res, data: mapReport(res.data) })),
  update: (id: string, data: Partial<SymptomReport>) => apiClient.put(`/symptom-reports/${id}`, data),
  delete: (id: string) => apiClient.delete(`/symptom-reports/${id}`),
  nearby: (location: GeoLocation, radiusKm?: number) =>
    apiClient
      .get<{ total: number; items: SymptomReport[] }>('/symptom-reports/nearby', {
        params: { latitude: location.latitude, longitude: location.longitude, radius_km: radiusKm ?? 20 },
      })
      .then((res) => ({ ...res, data: (res.data.items ?? []).map(mapReport) })),
}

export const diseasesApi = {
  list: (params?: Params) =>
    apiClient.get('/diseases', { params }).then((res) => ({
      ...res,
      data: paginate<Disease>((res.data ?? []).map(mapDisease)),
    })),
  search: (query: string) => {
    const symptoms = Array.isArray(query) ? query.join(',') : query
    return apiClient.get('/diseases/search-by-symptoms', { params: { symptoms } }).then((res) => ({
      ...res,
      data: (res.data ?? []).map(mapDisease),
    }))
  },
  get: (id: string) => apiClient.get(`/diseases/${id}`).then((res) => ({ ...res, data: mapDisease(res.data) })),
}

export const alertsApi = {
  list: (params?: Params) =>
    apiClient.get<Alert[]>('/alerts', { params }).then((res) => ({
      ...res,
      data: paginate<Alert>((res.data ?? []).map(mapAlert)),
    })),
  get: (id: string) => apiClient.get(`/alerts/${id}`).then((res) => ({ ...res, data: mapAlert(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/alerts', {
        title: data.title,
        message: data.message,
        severity: data.severity,
        alert_type: data.alertType ?? data.alert_type ?? 'disease_prevention',
        district: data.affectedArea ?? data.district,
        created_by: data.createdBy ? Number(data.createdBy) : undefined,
        expires_at: data.expiresAt,
        location: toPoint(data.location),
      })
      .then((res) => ({ ...res, data: mapAlert(res.data) })),
  update: (id: string, data: Partial<Alert>) => apiClient.post(`/alerts/${id}/deactivate`, data),
  delete: (id: string) => apiClient.post(`/alerts/${id}/deactivate`),
  nearby: (location: GeoLocation, radiusKm?: number) =>
    apiClient
      .get('/symptom-reports/nearby', {
        params: { latitude: location.latitude, longitude: location.longitude, radius_km: radiusKm ?? 20 },
      })
      .then((res) => ({ ...res, data: (res.data?.items ?? []).map(mapAlert) })),
}

export const vaccinationsApi = {
  list: (params?: Params) =>
    apiClient.get('/vaccinations', { params }).then((res) => ({
      ...res,
      data: paginate<Vaccination>((res.data ?? []).map(mapVaccination)),
    })),
  get: (id: string) => apiClient.get(`/vaccinations/${id}`).then((res) => ({ ...res, data: mapVaccination(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/vaccinations', {
        animal_id: Number(data.animalId ?? data.animal_id),
        vaccine_name: data.vaccineName ?? data.vaccine_name,
        disease_name: data.diseaseName ?? data.disease_name,
        date_administered: data.administeredOn ?? data.date_administered,
        next_due_date: data.nextDueOn ?? data.next_due_date,
        dose_number: data.doseNumber ?? data.dose_number ?? 1,
        status: data.status ?? 'completed',
      })
      .then((res) => ({ ...res, data: mapVaccination(res.data) })),
  update: (id: string, data: Partial<Vaccination>) => apiClient.put(`/vaccinations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/vaccinations/${id}`),
  schedule: (params?: Params) =>
    apiClient.get('/vaccinations/upcoming', { params }).then((res) => ({
      ...res,
      data: (res.data ?? []).map(mapVaccination),
    })),
  districtData: (params?: Params) =>
    apiClient.get('/vaccinations/district-data', { params }).then((res) => ({
      ...res,
      data: (res.data ?? []) as Record<string, unknown>[],
    })),
}

export const labSamplesApi = {
  list: (params?: Params) =>
    apiClient.get('/lab-samples', { params }).then((res) => ({
      ...res,
      data: paginate<LabSample>((res.data ?? []).map(mapLabSample)),
    })),
  get: (id: string) => apiClient.get(`/lab-samples/${id}`).then((res) => ({ ...res, data: mapLabSample(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/lab-samples', {
        symptom_report_id: data.reportId ? Number(data.reportId) : undefined,
        animal_id: data.animalId ? Number(data.animalId) : undefined,
        sample_type: data.sampleType ?? data.sample_type,
        collected_by: data.collectedBy ? Number(data.collectedBy) : undefined,
        collection_date: data.collectedOn ?? data.collection_date,
        lab_id: data.labName ?? data.lab_id,
        status: data.status ?? 'collected',
        result: data.result,
      })
      .then((res) => ({ ...res, data: mapLabSample(res.data) })),
  update: (id: string, data: Partial<LabSample>) =>
    apiClient
      .put(`/lab-samples/${id}/status`, { status: data.status, result: data.result })
      .then((res) => ({ ...res, data: mapLabSample(res.data) })),
  delete: (id: string) => apiClient.delete(`/lab-samples/${id}`),
}

export const outbreaksApi = {
  list: (params?: Params) =>
    apiClient.get<Outbreak[]>('/outbreaks', { params }).then((res) => ({
      ...res,
      data: paginate<Outbreak>((res.data ?? []).map(mapOutbreak)),
    })),
  get: (id: string) => apiClient.get(`/outbreaks/${id}`).then((res) => ({ ...res, data: mapOutbreak(res.data) })),
  create: (data: any) =>
    apiClient
      .post('/outbreaks', {
        disease_id: Number(data.diseaseId ?? data.disease_id),
        district: data.district,
        block: data.block,
        affected_villages: data.affectedVillages ?? data.affected_villages ?? [],
        affected_animal_count: data.atRiskAnimals ?? data.affected_animal_count ?? data.activeCases ?? 0,
        confirmed_cases: data.confirmedCases ?? data.confirmed_cases ?? 0,
        deaths: data.deaths ?? 0,
        risk_level: data.riskLevel ?? data.risk_level ?? 'medium',
        start_date: data.declaredOn ?? data.start_date,
        location: toPoint(data.location),
      })
      .then((res) => ({ ...res, data: mapOutbreak(res.data) })),
  update: (id: string, data: Partial<Outbreak>) =>
    apiClient
      .put(`/outbreaks/${id}/status`, { status: data.status, ...data })
      .then((res) => ({ ...res, data: mapOutbreak(res.data) })),
  stats: () =>
    apiClient.get('/outbreaks/stats').then((res) => ({ ...res, data: res.data as Record<string, number> })),
}

export const dashboardApi = {
  stats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats').then((res) => ({
      ...res,
      data: mapDashboardStats(res.data),
    })),
  heatmap: () =>
    apiClient.get<Outbreak[]>('/outbreaks').then((res) => {
      const map: Record<string, number> = {}
      ;(res.data ?? []).forEach((o: any) => {
        if (o?.location?.coordinates?.length >= 2) {
          const key = `${o.location.coordinates[1]},${o.location.coordinates[0]}`
          map[key] = (map[key] ?? 0) + 1
        }
      })
      ;(res.data ?? []).forEach((o: any) => {
        if (!o?.location && o?.district) {
          const seed = Array.from(String(o.district)).reduce((a, c) => a + c.charCodeAt(0), 0) % 1000
          const lat = 19.5 + (seed % 50) / 100
          const lng = 73.5 + ((seed >> 1) % 100) / 100
          const key = `${lat},${lng}`
          map[key] = (map[key] ?? 0) + 1
        }
      })
      return { ...res, data: map }
    }),
  summary: (params?: Params) =>
    apiClient.get<Record<string, unknown>[]>('/dashboard/district-summary', { params }).then((res) => ({
      ...res,
      data: (res.data ?? []).map((r: any) => ({
        district: r.district,
        state: r.state,
        totalAnimals: r.total_livestock ?? 0,
        totalReports: r.total_reports ?? 0,
        vaccinated: 0,
        outbreaks: r.active_outbreaks ?? 0,
      })),
    })),
  trends: (params?: Params) =>
    apiClient.get<{ series: Record<string, { date: string; count: number }[]> }>('/dashboard/disease-trends', { params }).then((res) => {
      const rows: { date: string; cases: number; confirmed: number }[] = []
      Object.values(res.data?.series ?? {}).forEach((pts) => {
        pts.forEach((pt) => rows.push({ date: pt.date, cases: pt.count, confirmed: 0 }))
      })
      rows.sort((a, b) => (a.date < b.date ? -1 : 1))
      return { ...res, data: rows }
    }),
  vaccinationCoverage: (params?: Params) =>
    apiClient.get('/dashboard/vaccination-coverage', { params }).then((res) => ({
      ...res,
      data: (res.data ?? []) as Record<string, unknown>[],
    })),
  surveillance: (params?: Params) =>
    apiClient.get('/dashboard/surveillance', { params }).then((res) => ({
      ...res,
      data: (res.data ?? []) as Record<string, unknown>[],
    })),
}

const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  Nagpur: { lat: 21.146, lng: 79.088 },
  Pune: { lat: 18.52, lng: 73.857 },
  Amravati: { lat: 20.933, lng: 77.75 },
  Nashik: { lat: 20.006, lng: 73.79 },
  Aurangabad: { lat: 19.876, lng: 75.343 },
  Kolhapur: { lat: 16.705, lng: 74.243 },
}

export const weatherApi = {
  riskAssessment: (params?: Params) => {
    const c = params?.district ? DISTRICT_COORDS[String(params.district)] : undefined
    return apiClient
      .get<WeatherRisk>('/weather/risk-assessment', {
        params: {
          latitude: params?.latitude ?? c?.lat ?? 19.5,
          longitude: params?.longitude ?? c?.lng ?? 74.5,
          condition: params?.condition ?? params?.riskLevel,
          temperature: params?.temperature,
          humidity: params?.humidity,
        },
      })
      .then((res) => {
        const d = res.data as any
        return {
          ...res,
          data: {
            district: params?.district ?? '',
            riskLevel: toSeverity(d?.overall_risk_level),
            temperature: d?.temperature ?? 0,
            humidity: d?.humidity ?? 0,
            rainfall: d?.precipitation ?? 0,
            windSpeed: d?.wind_speed ?? 0,
            correlatedDiseases: (d?.affected_diseases ?? []).map((x: any) => ({
              diseaseId: String(x.disease_code ?? ''),
              name: x.disease_code ?? '',
              correlation: x.risk_multiplier ?? 0,
            })),
            advice: d?.recommendations ?? [],
            updatedAt: d?.fetched_at ?? new Date().toISOString(),
          } as WeatherRisk,
        }
      })
  },
  forecast: (params?: Params) => {
    const c = params?.district ? DISTRICT_COORDS[String(params.district)] : undefined
    return apiClient
      .get<{ live: boolean; days: unknown[] }>('/weather/forecast', {
        params: {
          latitude: params?.latitude ?? c?.lat ?? 19.5,
          longitude: params?.longitude ?? c?.lng ?? 74.5,
        },
      })
      .then((res) => ({
        ...res,
        data: ((res.data?.days as any[]) ?? []).map((d) => ({
          day: d.day,
          tempMax: d.temp_max,
          tempMin: d.temp_min,
          humidity: d.humidity,
          rainfall: d.precipitation,
          condition: d.condition,
        })),
      }))
  },
}