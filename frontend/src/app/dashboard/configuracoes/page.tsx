'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  Chip,
  Link as MuiLink,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SecurityIcon from '@mui/icons-material/Security'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import InfoIcon from '@mui/icons-material/Info'
import LockIcon from '@mui/icons-material/Lock'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

const paperSx = { p: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }

export default function ConfiguracoesPage() {
  const { mode, toggleTheme, isDark } = useThemeMode()
  const router = useRouter()

  // Notificacoes state
  const [notificacoesEmail, setNotificacoesEmail] = useState(true)
  const [notificacoesPush, setNotificacoesPush] = useState(true)
  const [notificacoesSom, setNotificacoesSom] = useState(false)

  // Seguranca state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const handleExportData = () => {
    setSnackbar({
      open: true,
      message: 'Exportação de dados iniciada. Você receberá um email quando estiver pronto.',
      severity: 'info',
    })
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SettingsIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Configurações
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Gerencie aparência, notificações, segurança e dados da plataforma
        </Typography>
      </Box>

      {/* Aparencia Section */}
      <Paper sx={paperSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isDark ? (
            <DarkModeIcon sx={{ color: '#3b82f6' }} />
          ) : (
            <LightModeIcon sx={{ color: '#3b82f6' }} />
          )}
          <Typography variant="h6" fontWeight="bold">
            Aparência
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              Modo escuro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isDark
                ? 'O modo escuro está ativado. Alterne para o modo claro.'
                : 'O modo claro está ativado. Alterne para o modo escuro.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={isDark ? <DarkModeIcon sx={{ fontSize: '1rem !important' }} /> : <LightModeIcon sx={{ fontSize: '1rem !important' }} />}
              label={isDark ? 'Escuro' : 'Claro'}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              color="primary"
            />
          </Box>
        </Box>
      </Paper>

      {/* Notificacoes Section */}
      <Paper sx={paperSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="bold">
            Notificações
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notificacoesEmail}
                onChange={(e) => setNotificacoesEmail(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Notificações por email</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receba alertas de vencimento de apólice, atualizações de sinistros e novidades por email
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ my: 1 }} />

          <FormControlLabel
            control={
              <Switch
                checked={notificacoesPush}
                onChange={(e) => setNotificacoesPush(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Notificações push</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receba notificações em tempo real diretamente no navegador
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ my: 1 }} />

          <FormControlLabel
            control={
              <Switch
                checked={notificacoesSom}
                onChange={(e) => setNotificacoesSom(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Som de notificação</Typography>
                <Typography variant="caption" color="text.secondary">
                  Reproduza um som ao receber novas notificações
                </Typography>
              </Box>
            }
          />
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          As preferências de notificação serão sincronizadas com o servidor em breve.
        </Alert>
      </Paper>

      {/* Seguranca Section */}
      <Paper sx={paperSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SecurityIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="bold">
            Segurança
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Last Login */}
          <Box>
            <Typography variant="body1" fontWeight={500}>
              Último acesso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              16 de março de 2026, 10:30 - Navegador Chrome, Linux
            </Typography>
          </Box>

          <Divider />

          {/* Change Password */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Alterar senha
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atualize sua senha periodicamente para maior segurança
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => router.push('/dashboard/perfil')}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' },
              }}
            >
              Alterar Senha
            </Button>
          </Box>

          <Divider />

          {/* Two-Factor Authentication */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  Autenticação em dois fatores
                </Typography>
                <Chip label="Em breve" size="small" color="warning" variant="outlined" sx={{ height: 22 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Adicione uma camada extra de segurança à sua conta
              </Typography>
            </Box>
            <Switch
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              color="primary"
              disabled
            />
          </Box>
        </Box>
      </Paper>

      {/* Dados e Exportacao Section */}
      <Paper sx={paperSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CloudDownloadIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="bold">
            Dados e Exportação
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Exportar todos os dados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Baixe uma cópia de todos os seus dados em formato CSV ou PDF
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<CloudDownloadIcon />}
              onClick={handleExportData}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Exportar Dados
            </Button>
          </Box>

          <Divider />

          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
              Política de retenção de dados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seus dados são armazenados de forma segura e criptografada. Documentos e apólices são mantidos
              por tempo indeterminado enquanto sua conta estiver ativa. Logs de auditoria são retidos por
              5 anos conforme exigências regulatórias. Para solicitar a exclusão de dados, entre em contato
              com o suporte.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Sobre Section */}
      <Paper sx={paperSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight="bold">
            Sobre
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight={500}>
              Versão da plataforma
            </Typography>
            <Chip label="v1.0.0" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Documentação
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Acesse guias de uso, tutoriais e a documentação da API
              </Typography>
            </Box>
            <MuiLink
              href="/docs"
              underline="hover"
              sx={{ color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
            >
              Acessar documentação
            </MuiLink>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Suporte
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Precisa de ajuda? Entre em contato com nossa equipe de suporte
              </Typography>
            </Box>
            <MuiLink
              href="mailto:suporte@condocompare.com.br"
              underline="hover"
              sx={{ color: '#3b82f6', fontWeight: 600 }}
            >
              suporte@condocompare.com.br
            </MuiLink>
          </Box>
        </Box>
      </Paper>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
