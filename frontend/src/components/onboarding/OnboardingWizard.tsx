'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ShieldIcon from '@mui/icons-material/Shield'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ExploreIcon from '@mui/icons-material/Explore'
import CloseIcon from '@mui/icons-material/Close'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AnalyticsIcon from '@mui/icons-material/Analytics'

interface OnboardingWizardProps {
  open: boolean
  onComplete: () => void
}

const steps = [
  {
    title: 'Bem-vindo ao CondoCompare!',
    subtitle: 'Sua plataforma inteligente para gestão de seguros condominiais',
    icon: <ShieldIcon sx={{ fontSize: 64, color: '#3b82f6' }} />,
    description:
      'Vamos te guiar pelos primeiros passos para você aproveitar ao máximo a plataforma. São apenas 3 passos rápidos.',
    color: '#3b82f6',
  },
  {
    title: 'Cadastre seu Condomínio',
    subtitle: 'O primeiro passo é registrar as informações do condomínio',
    icon: <ApartmentIcon sx={{ fontSize: 64, color: '#10b981' }} />,
    description:
      'Acesse "Condomínios" no menu lateral e clique em "Novo Condomínio". Preencha os dados como nome, CNPJ, endereço e características do imóvel.',
    color: '#10b981',
  },
  {
    title: 'Importe seus Documentos',
    subtitle: 'A IA extrai automaticamente os dados para você',
    icon: <CloudUploadIcon sx={{ fontSize: 64, color: '#8b5cf6' }} />,
    description:
      'Faça upload de apólices, orçamentos e condições gerais em PDF. Nossa IA extrai automaticamente valores, coberturas e vigências.',
    color: '#8b5cf6',
  },
  {
    title: 'Explore as Funcionalidades',
    subtitle: 'Tudo pronto! Conheça o que você pode fazer',
    icon: <ExploreIcon sx={{ fontSize: 64, color: '#f59e0b' }} />,
    features: [
      { icon: <CompareArrowsIcon sx={{ fontSize: 20 }} />, text: 'Compare orçamentos lado a lado' },
      { icon: <AnalyticsIcon sx={{ fontSize: 20 }} />, text: 'Diagnóstico de Coberturas e Riscos' },
      { icon: <SmartToyIcon sx={{ fontSize: 20 }} />, text: 'Tire dúvidas com a IA' },
      { icon: <AssignmentIcon sx={{ fontSize: 20 }} />, text: 'Gerencie vistorias digitais' },
    ],
    color: '#f59e0b',
  },
]

export default function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete()
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleSkip = () => {
    onComplete()
  }

  const currentStep = steps[activeStep]

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={handleSkip}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'text.secondary' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>

        {/* Progress header */}
        <Box sx={{ px: 3, pt: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((_, index) => (
              <Step key={index}>
                <StepLabel />
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ px: 4, py: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: `${currentStep.color}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    {currentStep.icon}
                  </Box>
                </motion.div>

                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  {currentStep.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {currentStep.subtitle}
                </Typography>

                {currentStep.description && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7, maxWidth: 400, mx: 'auto' }}
                  >
                    {currentStep.description}
                  </Typography>
                )}

                {currentStep.features && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1, maxWidth: 320, mx: 'auto' }}>
                    {currentStep.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Box sx={{ color: currentStep.color }}>{feature.icon}</Box>
                          <Typography variant="body2" fontWeight={500}>
                            {feature.text}
                          </Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                )}
              </Box>
            </motion.div>
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'space-between' }}>
          <Button onClick={handleSkip} color="inherit" sx={{ color: 'text.secondary' }}>
            Pular
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep > 0 && (
              <Button onClick={handleBack} variant="outlined">
                Voltar
              </Button>
            )}
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleNext}
                variant="contained"
                sx={{ bgcolor: currentStep.color, '&:hover': { bgcolor: currentStep.color, filter: 'brightness(0.9)' } }}
              >
                {activeStep === steps.length - 1 ? 'Começar!' : 'Próximo'}
              </Button>
            </motion.div>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
