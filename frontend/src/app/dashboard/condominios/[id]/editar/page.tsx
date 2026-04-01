'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Box, CircularProgress, Alert, Typography } from '@mui/material'
import { CondominioForm } from '@/components/condominios/CondominioForm'
import { condominioService } from '@/services/condominioService'
import { CondominioResponse } from '@/types'

export default function EditarCondominioPage() {
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [condominio, setCondominio] = useState<CondominioResponse | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await condominioService.getById(id)
        setCondominio(data)
      } catch (err) {
        console.error('Error fetching condominio:', err)
        setError('Erro ao carregar dados do condomínio.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!condominio) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Condomínio não encontrado.</Typography>
      </Box>
    )
  }

  return <CondominioForm initialData={condominio} isEditing />
}
