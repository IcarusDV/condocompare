'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Switch,
} from '@mui/material'
import CompareIcon from '@mui/icons-material/Compare'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DescriptionIcon from '@mui/icons-material/Description'
import AssistantIcon from '@mui/icons-material/Assistant'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ShieldIcon from '@mui/icons-material/Shield'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import ApartmentIcon from '@mui/icons-material/Apartment'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import BusinessIcon from '@mui/icons-material/Business'
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import MenuIcon from '@mui/icons-material/Menu'
import StarIcon from '@mui/icons-material/Star'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GroupsIcon from '@mui/icons-material/Groups'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import HandshakeIcon from '@mui/icons-material/Handshake'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { motion, useInView } from 'framer-motion'

// ---------------------------------------------------------------------------
// Animated wrapper
// ---------------------------------------------------------------------------
function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
}: {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const NAV_LINKS = [
  { label: 'Sobre', href: '#sobre' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
]

const stats = [
  { label: 'Condominios Atendidos', value: 500, suffix: '+', icon: ApartmentIcon },
  { label: 'Documentos Analisados', value: 10000, suffix: '+', icon: InsertDriveFileIcon },
  { label: 'Seguradoras Parceiras', value: 50, suffix: '+', icon: BusinessIcon },
  { label: 'Precisao da IA', value: 99.5, suffix: '%', icon: PrecisionManufacturingIcon },
]

const features = [
  {
    title: 'Comparar Orçamentos',
    description:
      'Compare orçamentos lado a lado com detalhamento completo de coberturas, franquias e valores. Ranking automático identifica a melhor opção em segundos.',
    longDescription: 'Importe orçamentos de diferentes seguradoras e tenha uma visão consolidada com gráfico radar, matriz de coberturas e recomendação automática baseada em custo-benefício.',
    icon: CompareIcon,
    color: '#6366f1',
  },
  {
    title: 'Análise de Apólice',
    description:
      'Cruzamento inteligente entre características do condomínio, coberturas contratadas e condições gerais da seguradora.',
    longDescription: 'Identifique lacunas de cobertura, riscos não cobertos e oportunidades de economia com diagnóstico automático alimentado por IA.',
    icon: AnalyticsIcon,
    color: '#3b82f6',
  },
  {
    title: 'Diagnóstico Técnico',
    description:
      'Score de cobertura, dashboard com recomendações e relatório técnico resumido. Sugestões de seguros complementares incluídas.',
    longDescription: 'Cada condomínio recebe um score personalizado baseado em suas características, com ações prioritárias para melhorar a proteção.',
    icon: VerifiedUserIcon,
    color: '#22c55e',
  },
  {
    title: 'Vistoria Digital',
    description:
      'Três níveis de vistoria: básica com fotos e checklist, intermediária com apontamentos técnicos e completa com laudo técnico.',
    longDescription: 'Compartilhe vistorias por link externo, acompanhe o progresso do checklist em tempo real e gere laudos profissionais automaticamente.',
    icon: CameraAltIcon,
    color: '#f59e0b',
  },
  {
    title: 'Central de Sinistros',
    description:
      'Acompanhamento em tempo real dos sinistros do condomínio. Histórico completo e atualização do status de cada ocorrência.',
    longDescription: 'Registre sinistros com fotos e documentos, acompanhe prazos e status com a seguradora, e mantenha todo o histórico organizado.',
    icon: ReportProblemIcon,
    color: '#ef4444',
  },
  {
    title: 'Assistente IA',
    description:
      'Tire dúvidas sobre coberturas, franquias e regras do seguro. Análise de documentos com inteligência artificial avançada.',
    longDescription: 'Nosso assistente foi treinado com condições gerais de todas as principais seguradoras, legislação e normativas do seguro condominial.',
    icon: AssistantIcon,
    color: '#8b5cf6',
  },
]

const steps = [
  {
    number: '01',
    title: 'Importe seus documentos',
    description:
      'Faça upload de apólices, orçamentos, propostas e demais documentos. Aceitamos PDF e outros formatos.',
    icon: CloudUploadIcon,
  },
  {
    number: '02',
    title: 'IA analisa automaticamente',
    description:
      'Nossa inteligência artificial extrai, organiza e cruza informações de todos os documentos em segundos.',
    icon: AutoAwesomeIcon,
  },
  {
    number: '03',
    title: 'Receba recomendações',
    description:
      'Obtenha diagnósticos, scores de cobertura, comparativos e recomendações personalizadas.',
    icon: CheckCircleOutlineIcon,
  },
]

const showcaseItems = [
  {
    title: 'Dashboard Inteligente',
    description: 'Visão consolidada de todos os condomínios, apólices vigentes, sinistros e alertas em um único painel.',
    icon: DashboardIcon,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    title: 'Comparação Visual',
    description: 'Gráficos radar, matriz de coberturas e ranking automático para comparar orçamentos de forma intuitiva.',
    icon: SpeedIcon,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  },
  {
    title: 'Vistoria Completa',
    description: 'Checklist digital, galeria de fotos, laudo técnico e compartilhamento por link externo em uma única ferramenta.',
    icon: PhotoLibraryIcon,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
  },
]

const plans = [
  {
    name: 'Básico',
    description: 'Para síndicos e pequenas administradoras',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isFree: true,
    highlight: false,
    features: [
      { text: 'Até 5 condomínios', included: true },
      { text: 'Comparação básica de orçamentos', included: true },
      { text: '1 usuário', included: true },
      { text: 'Histórico de documentos', included: true },
      { text: 'Diagnóstico técnico', included: false },
      { text: 'Assistente IA', included: false },
      { text: 'Vistoria digital', included: false },
      { text: 'Central de sinistros', included: false },
    ],
    cta: 'Começar Grátis',
  },
  {
    name: 'Profissional',
    description: 'Para corretoras e administradoras',
    monthlyPrice: 197,
    yearlyPrice: 167,
    isFree: false,
    highlight: true,
    features: [
      { text: 'Condomínios ilimitados', included: true },
      { text: 'Todas as funcionalidades', included: true },
      { text: 'Até 10 usuários', included: true },
      { text: 'Assistente IA completo', included: true },
      { text: 'Diagnóstico técnico', included: true },
      { text: 'Vistoria digital (3 níveis)', included: true },
      { text: 'Central de sinistros', included: true },
      { text: 'Relatórios avançados', included: true },
    ],
    cta: 'Assinar Agora',
  },
  {
    name: 'Enterprise',
    description: 'Para grandes operações e white-label',
    monthlyPrice: -1,
    yearlyPrice: -1,
    isFree: false,
    highlight: false,
    features: [
      { text: 'Tudo do Profissional', included: true },
      { text: 'Usuários ilimitados', included: true },
      { text: 'API dedicada', included: true },
      { text: 'White-label personalizado', included: true },
      { text: 'Suporte premium 24/7', included: true },
      { text: 'Integração personalizada', included: true },
      { text: 'SLA garantido', included: true },
      { text: 'Gerente de conta dedicado', included: true },
    ],
    cta: 'Fale Conosco',
  },
]

const testimonials = [
  {
    name: 'Roberto Mendes',
    role: 'Síndico',
    company: 'Residencial Parque das Águas',
    text: 'O CondoCompare transformou a forma como gerencio o seguro do condomínio. Antes eu levava semanas para comparar orçamentos. Agora faço tudo em minutos, com muito mais confiança nas decisões.',
    avatar: 'RM',
  },
  {
    name: 'Carla Ferreira',
    role: 'Corretora de Seguros',
    company: 'CF Seguros',
    text: 'A plataforma me permite atender muito mais clientes com qualidade superior. O diagnóstico técnico automático e o assistente IA são ferramentas que não existiam no mercado.',
    avatar: 'CF',
  },
  {
    name: 'Marcos Almeida',
    role: 'Administradora',
    company: 'Premier Administração',
    text: 'Administramos mais de 80 condomínios e o CondoCompare centralizou tudo. A importação de documentos e a análise automática economizam horas de trabalho toda semana.',
    avatar: 'MA',
  },
]

const faqItems = [
  {
    question: 'O que é o CondoCompare?',
    answer: 'O CondoCompare é uma plataforma desenvolvida pela IRC Corretora de Seguros para simplificar a análise, comparação e gestão de seguros condominiais. Com inteligência artificial, a ferramenta automatiza a extração de dados de documentos, compara orçamentos, gera diagnósticos técnicos e oferece recomendações personalizadas para cada condomínio.',
  },
  {
    question: 'Quem pode usar a plataforma?',
    answer: 'A plataforma foi projetada para três perfis principais: Síndicos (visão do seu condomínio), Administradoras (gestão de múltiplos condomínios) e Corretoras de Seguros (visão completa de todos os clientes). Cada perfil tem permissões e funcionalidades adaptadas às suas necessidades.',
  },
  {
    question: 'Como funciona a inteligência artificial?',
    answer: 'Nossa IA utiliza tecnologia RAG (Retrieval-Augmented Generation) combinada com modelos de linguagem avançados. Ela é capaz de extrair dados de apólices e orçamentos em PDF, cruzar informações com condições gerais de seguradoras, legislação e normativas, gerando análises precisas e recomendações contextualizadas.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Utilizamos criptografia de ponta a ponta, autenticação JWT com refresh token, controle de acesso baseado em roles (RBAC), auditoria de todas as ações críticas e armazenamento seguro em servidores dedicados. Seus documentos e informações estão protegidos com as melhores práticas do mercado.',
  },
  {
    question: 'Posso importar apólices de qualquer seguradora?',
    answer: 'Sim! O CondoCompare aceita documentos em PDF de todas as seguradoras do mercado. Nossa IA é treinada para reconhecer e extrair informações de diferentes formatos e layouts de apólices, propostas e orçamentos.',
  },
  {
    question: 'O que está incluso no plano gratuito?',
    answer: 'O plano Básico (gratuito) permite cadastrar até 5 condomínios, fazer comparações básicas de orçamentos, importar documentos e manter um histórico. É ideal para síndicos que querem experimentar a plataforma antes de fazer um upgrade.',
  },
  {
    question: 'Como funciona a vistoria digital?',
    answer: 'A vistoria digital permite realizar inspeções do condomínio diretamente pela plataforma, com checklist personalizado, upload de fotos, apontamentos técnicos e geração automática de laudo. Você pode compartilhar a vistoria por link externo com qualquer pessoa, sem necessidade de cadastro.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim. Não há fidelidade ou multa por cancelamento. Você pode fazer upgrade, downgrade ou cancelar seu plano a qualquer momento. Seus dados ficam disponíveis por 30 dias após o cancelamento para que você possa exportá-los.',
  },
  {
    question: 'Oferecem suporte técnico?',
    answer: 'Sim! Todos os planos incluem suporte por email. O plano Profissional inclui suporte prioritário com tempo de resposta reduzido. O plano Enterprise oferece suporte premium 24/7 com gerente de conta dedicado e canal direto de comunicação.',
  },
  {
    question: 'Como começar a usar?',
    answer: 'Basta criar uma conta gratuita, selecionar seu perfil (Síndico, Administradora ou Corretora), cadastrar seus condomínios e começar a importar documentos. Em poucos minutos você já terá acesso a comparações e diagnósticos. Se precisar de ajuda, nosso suporte está disponível para auxiliar no onboarding.',
  },
]

const values = [
  { icon: HandshakeIcon, title: 'Transparência', description: 'Informações claras e acessíveis para decisões conscientes.' },
  { icon: EmojiObjectsIcon, title: 'Inovação', description: 'Tecnologia de ponta aplicada ao mercado de seguros.' },
  { icon: StarIcon, title: 'Excelência', description: 'Compromisso com a qualidade em cada detalhe da plataforma.' },
  { icon: SecurityIcon, title: 'Segurança', description: 'Proteção dos dados com os mais altos padrões do mercado.' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [yearlyBilling, setYearlyBilling] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = useCallback((href: string) => {
    setMobileMenuOpen(false)
    const id = href.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <Box sx={{ overflowX: 'hidden', bgcolor: '#ffffff' }}>
      {/* ================================================================= */}
      {/* NAVBAR                                                            */}
      {/* ================================================================= */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: scrolled ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(99,102,241,0.15)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.5 }}
          >
            {/* Logo */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ShieldIcon sx={{ fontSize: 32, color: '#6366f1' }} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#ffffff', fontWeight: 800, lineHeight: 1.1, fontSize: '1.1rem' }}
                >
                  IRC Corretora
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', letterSpacing: 1 }}
                >
                  DE SEGUROS
                </Typography>
              </Box>
            </Stack>

            {/* Desktop nav links */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <Box sx={{ width: 16 }} />
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' },
                }}
              >
                Entrar
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#6366f1',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  '&:hover': { bgcolor: '#4f46e5' },
                }}
              >
                Comecar Gratis
              </Button>
            </Stack>

            {/* Mobile menu button */}
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: '#fff' }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            width: 280,
            pt: 2,
          },
        }}
      >
        <Box sx={{ px: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShieldIcon sx={{ fontSize: 24, color: '#6366f1' }} />
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>IRC Corretora</Typography>
          </Stack>
          <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton onClick={() => scrollToSection(link.href)}>
                <ListItemText
                  primary={link.label}
                  sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.7)', fontWeight: 500 } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ px: 2, mt: 2 }}>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            fullWidth
            sx={{
              borderColor: 'rgba(255,255,255,0.25)',
              color: '#fff',
              mb: 1.5,
              textTransform: 'none',
              '&:hover': { borderColor: '#6366f1' },
            }}
          >
            Entrar
          </Button>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            fullWidth
            sx={{ bgcolor: '#6366f1', textTransform: 'none', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            Comecar Gratis
          </Button>
        </Box>
      </Drawer>

      {/* ================================================================= */}
      {/* HERO                                                              */}
      {/* ================================================================= */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: '100vh', md: '92vh' },
          display: 'flex',
          alignItems: 'center',
          pt: { xs: 10, md: 0 },
        }}
      >
        {/* Decorative gradient circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            top: -200,
            right: -100,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
            bottom: -100,
            left: -100,
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 0 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    px: 2,
                    py: 0.5,
                    mb: 3,
                  }}
                >
                  <ShieldIcon sx={{ fontSize: 18, color: '#818cf8' }} />
                  <Typography variant="body2" sx={{ color: '#c7d2fe', fontWeight: 500 }}>
                    Tecnologia exclusiva da IRC Corretora de Seguros
                  </Typography>
                </Box>

                <Typography
                  variant="h1"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
                    lineHeight: 1.15,
                    mb: 2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  IRC Corretora de{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(90deg, #818cf8, #22c55e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Seguros
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 600,
                    mb: 2,
                    fontSize: { xs: '1.1rem', md: '1.35rem' },
                  }}
                >
                  Tecnologia e expertise para revolucionar a gestao de seguro condominial
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 400,
                    lineHeight: 1.7,
                    mb: 5,
                    maxWidth: 540,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                  }}
                >
                  Conheça o <strong style={{ color: '#818cf8' }}>CondoCompare</strong> — nossa
                  plataforma própria que combina inteligência artificial com anos de experiência
                  no mercado de seguros condominiais. Importe documentos, compare orçamentos e receba
                  diagnósticos inteligentes. Tudo em um só lugar.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: '#6366f1',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      px: 4,
                      py: 1.6,
                      borderRadius: 3,
                      textTransform: 'none',
                      boxShadow: '0 0 40px rgba(99,102,241,0.35)',
                      '&:hover': {
                        bgcolor: '#4f46e5',
                        boxShadow: '0 0 50px rgba(99,102,241,0.5)',
                      },
                    }}
                  >
                    Comecar Gratis
                  </Button>
                  <Button
                    onClick={() => scrollToSection('#planos')}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '1rem',
                      px: 4,
                      py: 1.6,
                      borderRadius: 3,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#6366f1',
                        bgcolor: 'rgba(99,102,241,0.08)',
                      },
                    }}
                  >
                    Conhecer Planos
                  </Button>
                </Stack>
              </motion.div>
            </Grid>

            {/* Hero right – decorative icon cluster */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              >
                <Box sx={{ position: 'relative', width: 380, height: 380 }}>
                  {/* Central icon */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 60px rgba(99,102,241,0.4)',
                    }}
                  >
                    <ShieldIcon sx={{ fontSize: 56, color: '#fff' }} />
                  </Box>

                  {/* Orbiting icons */}
                  {[
                    { Icon: CompareIcon, top: '5%', left: '50%', color: '#6366f1' },
                    { Icon: AnalyticsIcon, top: '30%', left: '90%', color: '#3b82f6' },
                    { Icon: DescriptionIcon, top: '70%', left: '85%', color: '#22c55e' },
                    { Icon: AssistantIcon, top: '90%', left: '45%', color: '#8b5cf6' },
                    { Icon: CameraAltIcon, top: '65%', left: '5%', color: '#f59e0b' },
                    { Icon: VerifiedUserIcon, top: '20%', left: '8%', color: '#ef4444' },
                  ].map(({ Icon, top, left, color }, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                      style={{ position: 'absolute', top, left }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.07)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 26, color }} />
                      </Box>
                    </motion.div>
                  ))}

                  {/* Rings */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 240,
                      height: 240,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 340,
                      height: 340,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* STATS BAR                                                         */}
      {/* ================================================================= */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #0f172a 0%, #162032 100%)',
          py: { xs: 5, md: 4 },
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, i) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <AnimatedSection delay={i * 0.1}>
                  <Stack alignItems="center" spacing={1}>
                    <stat.icon sx={{ fontSize: 32, color: '#6366f1', mb: 0.5 }} />
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                      }}
                    >
                      {stat.value === 99.5 ? (
                        <AnimatedCounter target={99} suffix=".5%" duration={1800} />
                      ) : (
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={1800} />
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: 0.5, textAlign: 'center' }}
                    >
                      {stat.label}
                    </Typography>
                  </Stack>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* SOBRE A IRC                                                       */}
      {/* ================================================================= */}
      <Box id="sobre" sx={{ py: { xs: 10, md: 14 }, bgcolor: '#ffffff', scrollMarginTop: '80px' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            {/* Left – text */}
            <Grid item xs={12} md={6}>
              <AnimatedSection>
                <Typography
                  variant="overline"
                  sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
                >
                  Quem Somos
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: '#0f172a',
                    mt: 1,
                    mb: 3,
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                  }}
                >
                  Especialistas em seguro condominial
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#475569', lineHeight: 1.8, mb: 2, fontSize: '1.05rem' }}
                >
                  A <strong>IRC Corretora de Seguros</strong> nasceu com um proposito claro: transformar
                  a forma como condomínios contratam e gerenciam seus seguros. Com anos de experiência
                  no mercado condominial, entendemos as dores de síndicos, administradoras e corretores
                  que lidam diariamente com documentos complexos, comparações manuais e falta de
                  transparência nas informações.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#475569', lineHeight: 1.8, mb: 4, fontSize: '1.05rem' }}
                >
                  Foi dessa vivência que desenvolvemos o <strong style={{ color: '#6366f1' }}>CondoCompare</strong> —
                  uma plataforma que une nossa expertise no seguro condominial com o que há de mais
                  avançado em inteligência artificial. O resultado é uma ferramenta que economiza tempo,
                  reduz erros e garante que cada condomínio tenha a proteção adequada.
                </Typography>

                <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#6366f1' }}>
                      <AnimatedCounter target={10} suffix="+" duration={1200} />
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Anos de mercado
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#6366f1' }}>
                      <AnimatedCounter target={500} suffix="+" duration={1500} />
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Clientes ativos
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#6366f1' }}>
                      <AnimatedCounter target={30} suffix="+" duration={1200} />
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Seguradoras
                    </Typography>
                  </Box>
                </Stack>
              </AnimatedSection>
            </Grid>

            {/* Right – illustration / values */}
            <Grid item xs={12} md={6}>
              <AnimatedSection delay={0.2}>
                <Box
                  sx={{
                    background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)',
                    borderRadius: 4,
                    p: { xs: 3, md: 5 },
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                      top: -100,
                      right: -100,
                      pointerEvents: 'none',
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{ color: '#fff', fontWeight: 700, mb: 4, position: 'relative', zIndex: 1 }}
                  >
                    Nossos Valores
                  </Typography>
                  <Grid container spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
                    {values.map((v, i) => (
                      <Grid item xs={6} key={v.title}>
                        <Box
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 3,
                            p: 2.5,
                            height: '100%',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.1)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <v.icon sx={{ fontSize: 32, color: '#818cf8', mb: 1.5 }} />
                          <Typography
                            variant="subtitle2"
                            sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}
                          >
                            {v.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}
                          >
                            {v.description}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </AnimatedSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* FEATURES                                                          */}
      {/* ================================================================= */}
      <Box id="funcionalidades" sx={{ py: { xs: 10, md: 14 }, bgcolor: '#f8fafc', scrollMarginTop: '80px' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Funcionalidades
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Tudo que você precisa em um só lugar
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#64748b',
                  maxWidth: 600,
                  mx: 'auto',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                }}
              >
                O CondoCompare reúne ferramentas poderosas para analisar, comparar e gerenciar
                o seguro do seu condomínio com inteligência artificial.
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={3}>
            {features.map((feature, i) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <AnimatedSection delay={i * 0.08}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      bgcolor: '#ffffff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: feature.color,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 3,
                          bgcolor: `${feature.color}14`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                        }}
                      >
                        <feature.icon sx={{ fontSize: 28, color: feature.color }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5, fontSize: '1.1rem' }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem', mb: 1.5 }}
                      >
                        {feature.description}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.82rem', fontStyle: 'italic' }}
                      >
                        {feature.longDescription}
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* HOW IT WORKS                                                      */}
      {/* ================================================================= */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#22c55e', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Como funciona
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Simples como 1, 2, 3
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b', maxWidth: 520, mx: 'auto', fontSize: '1.05rem' }}
              >
                Em poucos minutos você terá uma visão completa do seguro do seu condomínio.
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={4} alignItems="stretch">
            {steps.map((step, i) => (
              <Grid item xs={12} md={4} key={step.number}>
                <AnimatedSection delay={i * 0.15}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      px: 3,
                      py: 5,
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        color: '#e2e8f0',
                        lineHeight: 1,
                        mb: 2,
                        userSelect: 'none',
                      }}
                    >
                      {step.number}
                    </Typography>

                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: i === 1 ? '#6366f1' : '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow:
                          i === 1
                            ? '0 0 40px rgba(99,102,241,0.3)'
                            : '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    >
                      <step.icon sx={{ fontSize: 32, color: '#ffffff' }} />
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#64748b', lineHeight: 1.7, maxWidth: 300, mx: 'auto' }}
                    >
                      {step.description}
                    </Typography>

                    {i < steps.length - 1 && (
                      <Box
                        sx={{
                          display: { xs: 'none', md: 'block' },
                          position: 'absolute',
                          right: -20,
                          top: '45%',
                          color: '#cbd5e1',
                        }}
                      >
                        <ArrowForwardIcon sx={{ fontSize: 28 }} />
                      </Box>
                    )}
                  </Box>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* SHOWCASE                                                          */}
      {/* ================================================================= */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#3b82f6', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Plataforma
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Veja o CondoCompare em acao
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b', maxWidth: 560, mx: 'auto', fontSize: '1.05rem' }}
              >
                Uma interface moderna e intuitiva projetada para simplificar o seu dia a dia.
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={4}>
            {showcaseItems.map((item, i) => (
              <Grid item xs={12} md={4} key={item.title}>
                <AnimatedSection delay={i * 0.12}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                        transform: 'translateY(-6px)',
                      },
                    }}
                  >
                    {/* Preview area with glassmorphism */}
                    <Box
                      sx={{
                        background: item.gradient,
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                        }}
                      />
                      <Box
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 3,
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <item.icon sx={{ fontSize: 56, color: '#fff' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* PRICING                                                           */}
      {/* ================================================================= */}
      <Box id="planos" sx={{ py: { xs: 10, md: 14 }, bgcolor: '#ffffff', scrollMarginTop: '80px' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="overline"
                sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Planos e Precos
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Escolha o plano ideal para você
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b', maxWidth: 500, mx: 'auto', fontSize: '1.05rem', mb: 4 }}
              >
                Comece grátis e faça upgrade quando precisar. Sem fidelidade.
              </Typography>

              {/* Billing toggle */}
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: yearlyBilling ? 400 : 700, color: yearlyBilling ? '#94a3b8' : '#0f172a' }}
                >
                  Mensal
                </Typography>
                <Switch
                  checked={yearlyBilling}
                  onChange={(e) => setYearlyBilling(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1' },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: yearlyBilling ? 700 : 400, color: yearlyBilling ? '#0f172a' : '#94a3b8' }}
                >
                  Anual
                </Typography>
                {yearlyBilling && (
                  <Chip
                    label="Economize 15%"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34,197,94,0.1)',
                      color: '#16a34a',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Stack>
            </Box>
          </AnimatedSection>

          <Grid container spacing={3} alignItems="stretch" justifyContent="center">
            {plans.map((plan, i) => (
              <Grid item xs={12} sm={6} md={4} key={plan.name}>
                <AnimatedSection delay={i * 0.1}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: plan.highlight ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'all 0.3s ease',
                      transform: plan.highlight ? 'scale(1.03)' : 'none',
                      boxShadow: plan.highlight ? '0 12px 40px rgba(99,102,241,0.15)' : 'none',
                      '&:hover': {
                        boxShadow: plan.highlight
                          ? '0 16px 50px rgba(99,102,241,0.2)'
                          : '0 8px 30px rgba(0,0,0,0.08)',
                        transform: plan.highlight ? 'scale(1.05)' : 'translateY(-4px)',
                      },
                    }}
                  >
                    {plan.highlight && (
                      <Chip
                        label="Mais Popular"
                        size="small"
                        icon={<StarIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          position: 'absolute',
                          top: -14,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: '#6366f1',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: '#fff' },
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                        {plan.description}
                      </Typography>

                      {/* Price */}
                      <Box sx={{ mb: 3 }}>
                        {plan.isFree ? (
                          <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Gratis
                          </Typography>
                        ) : plan.monthlyPrice === -1 ? (
                          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Sob Consulta
                          </Typography>
                        ) : (
                          <Stack direction="row" alignItems="baseline" spacing={0.5}>
                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
                              R$
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              /mes
                            </Typography>
                          </Stack>
                        )}
                        {yearlyBilling && !plan.isFree && plan.monthlyPrice !== -1 && (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Cobrado anualmente (R$ {plan.yearlyPrice * 12}/ano)
                          </Typography>
                        )}
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      {/* Features list */}
                      <Box sx={{ flex: 1, mb: 3 }}>
                        {plan.features.map((f) => (
                          <Stack
                            key={f.text}
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ mb: 1.5 }}
                          >
                            {f.included ? (
                              <CheckIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                            ) : (
                              <CloseIcon sx={{ fontSize: 18, color: '#d1d5db' }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: f.included ? '#334155' : '#94a3b8',
                                fontSize: '0.88rem',
                              }}
                            >
                              {f.text}
                            </Typography>
                          </Stack>
                        ))}
                      </Box>

                      {/* CTA */}
                      <Button
                        component={Link}
                        href={plan.monthlyPrice === -1 ? '/register' : '/register'}
                        variant={plan.highlight ? 'contained' : 'outlined'}
                        fullWidth
                        size="large"
                        sx={{
                          mt: 'auto',
                          borderRadius: 3,
                          py: 1.4,
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          ...(plan.highlight
                            ? {
                                bgcolor: '#6366f1',
                                color: '#fff',
                                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                                '&:hover': { bgcolor: '#4f46e5' },
                              }
                            : {
                                borderColor: '#e2e8f0',
                                color: '#334155',
                                '&:hover': { borderColor: '#6366f1', color: '#6366f1' },
                              }),
                        }}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* TESTIMONIALS                                                      */}
      {/* ================================================================= */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Depoimentos
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Quem usa, recomenda
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={4}>
            {testimonials.map((t, i) => (
              <Grid item xs={12} md={4} key={t.name}>
                <AnimatedSection delay={i * 0.12}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      bgcolor: '#ffffff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <FormatQuoteIcon
                        sx={{ fontSize: 36, color: '#6366f1', opacity: 0.25, mb: 1 }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#334155',
                          lineHeight: 1.8,
                          mb: 3,
                          fontStyle: 'italic',
                          fontSize: '0.95rem',
                        }}
                      >
                        &ldquo;{t.text}&rdquo;
                      </Typography>
                      <Divider sx={{ mb: 2.5 }} />
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: '#6366f1',
                            fontWeight: 700,
                            width: 44,
                            height: 44,
                            fontSize: '0.9rem',
                          }}
                        >
                          {t.avatar}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: '#0f172a' }}
                          >
                            {t.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {t.role} &middot; {t.company}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* FAQ                                                               */}
      {/* ================================================================= */}
      <Box id="faq" sx={{ py: { xs: 10, md: 14 }, bgcolor: '#ffffff', scrollMarginTop: '80px' }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{ color: '#6366f1', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem' }}
              >
                Duvidas
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Perguntas Frequentes
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b', maxWidth: 480, mx: 'auto', fontSize: '1.05rem' }}
              >
                Encontre respostas para as duvidas mais comuns sobre o CondoCompare.
              </Typography>
            </Box>
          </AnimatedSection>

          {faqItems.map((faq, i) => (
            <AnimatedSection key={i} delay={i * 0.05}>
              <Accordion
                elevation={0}
                disableGutters
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px !important',
                  mb: 1.5,
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                  '&.Mui-expanded': {
                    borderColor: '#6366f1',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}
                  sx={{
                    px: 3,
                    py: 0.5,
                    '&.Mui-expanded': { minHeight: 48 },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </AnimatedSection>
          ))}
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* CTA                                                               */}
      {/* ================================================================= */}
      <Box
        sx={{
          py: { xs: 10, md: 12 },
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            top: -200,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <AnimatedSection>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{
                  color: '#ffffff',
                  fontWeight: 800,
                  mb: 2.5,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                Pronto para começar?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  mb: 5,
                  maxWidth: 500,
                  mx: 'auto',
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                }}
              >
                Crie sua conta gratuita e descubra como a IRC Corretora e o CondoCompare podem
                transformar a gestão do seguro do seu condomínio.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#6366f1',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 5,
                    py: 1.6,
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 0 40px rgba(99,102,241,0.35)',
                    '&:hover': {
                      bgcolor: '#4f46e5',
                      boxShadow: '0 0 50px rgba(99,102,241,0.5)',
                    },
                  }}
                >
                  Criar Conta Gratis
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 5,
                    py: 1.6,
                    borderRadius: 3,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#6366f1',
                      bgcolor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  Ja tenho conta
                </Button>
              </Stack>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#0a0f1e',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          pt: { xs: 6, md: 8 },
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Column 1 - Brand */}
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <ShieldIcon sx={{ fontSize: 28, color: '#6366f1' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, lineHeight: 1.1, fontSize: '1rem' }}>
                    IRC Corretora
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', letterSpacing: 0.8 }}>
                    DE SEGUROS
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, mb: 2, fontSize: '0.85rem' }}>
                Especialistas em seguro condominial. Tecnologia e expertise para proteger o seu patrimonio.
              </Typography>
              <Chip
                label="Powered by CondoCompare"
                size="small"
                sx={{
                  bgcolor: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              />
            </Grid>

            {/* Column 2 - Product */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                Produto
              </Typography>
              {[
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Planos', href: '#planos' },
                { label: 'Como Funciona', href: '#' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <Typography
                  key={link.label}
                  variant="body2"
                  onClick={() => scrollToSection(link.href)}
                  sx={{
                    color: 'rgba(255,255,255,0.45)',
                    mb: 1.2,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    '&:hover': { color: '#818cf8' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Grid>

            {/* Column 3 - Support */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                Suporte
              </Typography>
              {['Central de Ajuda', 'Termos de Uso', 'Politica de Privacidade', 'Status do Sistema'].map(
                (label) => (
                  <Typography
                    key={label}
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.45)',
                      mb: 1.2,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      '&:hover': { color: '#818cf8' },
                    }}
                  >
                    {label}
                  </Typography>
                )
              )}
            </Grid>

            {/* Column 4 - Contact */}
            <Grid item xs={12} sm={6} md={5}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                Contato
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EmailIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                    contato@ircseguros.com.br
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PhoneIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                    (11) 99999-9999
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocationOnIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                    Sao Paulo, SP — Brasil
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          {/* Bottom bar */}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mt: 5, mb: 3 }} />
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} IRC Corretora de Seguros. Todos os direitos reservados.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
              Feito com CondoCompare v1.0
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
