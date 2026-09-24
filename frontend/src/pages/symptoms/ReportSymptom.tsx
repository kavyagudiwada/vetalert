import { useState, useEffect} from 'react'
import { useNavigate , useSearchParams} from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  Divider,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Stack,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PetsIcon from '@mui/icons-material/Pets'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { symptomReportsApi } from '../../api/endpoints'
import { useGeolocation } from '../../hooks/useGeolocation'
import { SPECIES_LIST } from '../../utils/constants'
import SymptomSelector from '../../components/symptoms/SymptomSelector'
import type { Species } from '../../types'

const STEPS = ['reports.selectAnimal', 'reports.selectSymptoms', 'reports.description', 'reports.location', 'reports.uploadPhotos']

export default function ReportSymptom() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()  
  const theme = useTheme()
  const geolocation = useGeolocation()

  const [step, setStep] = useState(0)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [existingAnimal, setExistingAnimal] = useState(false)
  const [animalTagId, setAnimalTagId] = useState('')
  const [animalId, setAnimalId] = useState('')
  useEffect(() => {
  const id = searchParams.get('animalId')

  if (id) {
    setAnimalId(id)
    setExistingAnimal(true)
  }
}, [searchParams])
  const [newAnimalName, setNewAnimalName] = useState('')
  const [species, setSpecies] = useState<Species>('cattle')
  const [breed, setBreed] = useState('')

  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
  const [locManual, setLocManual] = useState(false)
  const [latText, setLatText] = useState('')
  const [lngText, setLngText] = useState('')
  const [village, setVillage] = useState('')
  const [block, setBlock] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createReport = useMutation({
    mutationFn: () =>
      symptomReportsApi.create({
        reporterId: 'current-user',
        animalId,
        species,
        symptoms: selectedSymptoms,
        description,
        photos,
        location: { ...location, address: `${village}, ${block}, ${district}` },
        village,
        block,
        district,
        state,
        severity: 'medium',
        statusHistory: [
          { status: 'reported', timestamp: new Date().toISOString() },
        ],
      }),
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error(t('reports.selectSymptoms'))
      return
    }
    await createReport.mutateAsync()
  }

  const detectLocation = async () => {
    try {
      const loc = await geolocation.requestLocation()
      setLocation(loc)
      setLocManual(false)
      toast.success(t('reports.autoDetect'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const fileList = Array.from(files).slice(0, 5 - photos.length)
    fileList.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotos((prev) =>
          prev.length < 5 ? [...prev, reader.result as string] : prev,
        )
      }
      reader.readAsDataURL(file)
    })
  }

  const validateStep = (current: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (current === 0 && species === 'cattle') {
      if (existingAnimal && !animalTagId.trim()) {
        newErrors.animalTagId = t('common.required')
      } else if (!existingAnimal && !newAnimalName.trim()) {
        newErrors.newAnimalName = t('common.required')
      }
    }
    if (current === 3) {
      const lat = locManual ? parseFloat(latText) : location.latitude
      const lng = locManual ? parseFloat(lngText) : location.longitude
      if (!locManual) {
        if (!location.latitude && !location.longitude) {
          newErrors.location = t('common.required')
        }
      } else if (Number.isNaN(lat) || Number.isNaN(lng)) {
        newErrors.location = t('common.invalid')
      }
      if (!village.trim()) newErrors.village = t('common.required')
      if (!district.trim()) newErrors.district = t('common.required')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const canProceed = () => {
    if (step === 0) {
      return existingAnimal ? Boolean(animalId) : Boolean(species)
    }
    if (step === 1) return selectedSymptoms.length > 0
    if (step === 2) return description.trim().length >= 5
    if (step === 3) {
      return Boolean(locManual ? latText && lngText : location.latitude) &&
        Boolean(village && district)
    }
    return true
  }

  if (submitted) {
    return (
      <Box
        sx={{
          maxWidth: 480,
          mx: 'auto',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            bgcolor: 'success.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            mx: 'auto',
            mb: 3,
          }}
        >
          ✓
        </Box>
        <Typography variant="h5" fontWeight={700} mb={1}>
          {t('reports.reportSubmitted')}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {t('reports.reportSubmittedMessage')}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/reports')}>
            {t('reports.listView')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            {t('nav.dashboard')}
          </Button>
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {t('reports.reportSymptom')}
      </Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>
              {t(label)}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={t('reports.useExisting')}
                  color={existingAnimal ? 'primary' : 'default'}
                  onClick={() => setExistingAnimal(true)}
                  icon={<PetsIcon />}
                />
                <Chip
                  label={t('reports.addNewAnimal')}
                  color={!existingAnimal ? 'primary' : 'default'}
                  onClick={() => setExistingAnimal(false)}
                  icon={<AddPhotoAlternateIcon />}
                />
              </Stack>
            </Grid>
            {existingAnimal ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('animals.tagId')}
                    value={animalTagId}
                    onChange={(e) => {
                      setAnimalTagId(e.target.value)
                      setAnimalId(e.target.value)
                    }}
                    error={Boolean(errors.animalTagId)}
                    helperText={errors.animalTagId}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography fontSize={12} color="text.secondary">
                    {t('reports.selectExistingHint')}
                  </Typography>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('reports.species')}</InputLabel>
                    <Select
                      value={species}
                      label={t('reports.species')}
                      onChange={(e) => setSpecies(e.target.value as Species)}
                    >
                      {SPECIES_LIST.map((s) => (
                        <MenuItem key={s} value={s}>
                          {t(`animals.${s}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('animals.breed')}
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={`${t('animals.name')} (${t('reports.optional')})`}
                    value={newAnimalName}
                    onChange={(e) => setNewAnimalName(e.target.value)}
                    error={Boolean(errors.newAnimalName)}
                    helperText={errors.newAnimalName}
                  />
                </Grid>
              </>
            )}
          </Grid>
        )}

        {step === 1 && (
          <Box>
            <Typography fontSize={12} color="text.secondary" mb={1}>
              {t('reports.selectSymptomsHint')}
            </Typography>
            <SymptomSelector
              value={selectedSymptoms}
              onChange={setSelectedSymptoms}
            />
            {selectedSymptoms.length === 0 && (
              <Typography fontSize={12} color="error" mt={1}>
                {t('common.required')}
              </Typography>
            )}
          </Box>
        )}

        {step === 2 && (
          <TextField
            fullWidth
            multiline
            minRows={5}
            label={t('reports.description')}
            placeholder={t('reports.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={Boolean(description.trim() && description.trim().length < 5)}
            helperText={`${description.length} characters`}
          />
        )}

        {step === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<MyLocationIcon />}
                  label={t('reports.autoDetect')}
                  color={!locManual ? 'primary' : 'default'}
                  onClick={() => {
                    setLocManual(false)
                    void detectLocation()
                  }}
                />
                <Chip
                  icon={<LocationOnIcon />}
                  label={t('reports.manualLocation')}
                  color={locManual ? 'primary' : 'default'}
                  onClick={() => setLocManual(true)}
                />
              </Stack>
            </Grid>

            {locManual ? (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={latText}
                    onChange={(e) => setLatText(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={lngText}
                    onChange={(e) => setLngText(e.target.value)}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert
                  severity={location.latitude ? 'success' : 'info'}
                  icon={location.latitude ? <LocationOnIcon /> : <MyLocationIcon />}
                >
                  {location.latitude
                    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                    : t('reports.locationHint')}
                </Alert>
                <Button
                  startIcon={<MyLocationIcon />}
                  onClick={detectLocation}
                  sx={{ mt: 1 }}
                  size="small"
                >
                  {t('reports.autoDetect')}
                </Button>
              </Grid>
            )}

            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('reports.village')}
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                error={Boolean(errors.village)}
                helperText={errors.village}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('reports.block')}
                value={block}
                onChange={(e) => setBlock(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('reports.district')}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                error={Boolean(errors.district)}
                helperText={errors.district}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('reports.state')}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        {step === 4 && (
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              multiple
              onChange={handlePhotoUpload}
            />
            <Grid container spacing={1.5}>
              {photos.map((photo, index) => (
                <Grid item key={index}>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={photo}
                      sx={{
                        width: 88,
                        height: 88,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() =>
                        setPhotos(photos.filter((_, i) => i !== index))
                      }
                      sx={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        bgcolor: 'error.main',
                        color: 'white',
                        width: 20,
                        height: 20,
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      ×
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              {photos.length < 5 && (
                <Grid item>
                  <label htmlFor="photo-upload">
                    <Box
                      sx={{
                        width: 88,
                        height: 88,
                        borderRadius: 2,
                        border: 2,
                        borderStyle: 'dashed',
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }}
                    >
                      <AddPhotoAlternateIcon />
                      <Typography fontSize={9} mt={0.5}>
                        {photos.length}/5
                      </Typography>
                    </Box>
                  </label>
                </Grid>
              )}
            </Grid>
            <Typography fontSize={12} color="text.secondary" mt={1.5}>
              {t('reports.uploadPhotos')}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0}
            startIcon={<ArrowBackIcon />}
          >
            {t('common.back')}
          </Button>
          {step === STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createReport.isPending}
              endIcon={<ArrowForwardIcon />}
            >
              {t('common.submit')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={goNext}
              disabled={!canProceed()}
              endIcon={<ArrowForwardIcon />}
            >
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  )
}