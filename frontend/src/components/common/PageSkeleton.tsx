'use client'

import { Box, Skeleton, Paper, Grid } from '@mui/material'

export function TablePageSkeleton({ statCards = 0 }: { statCards?: number }) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} animation="wave" />
        <Skeleton variant="rounded" width={140} height={36} animation="wave" />
      </Box>

      {/* Stat cards */}
      {statCards > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: statCards }).map((_, i) => (
            <Grid item xs={6} md={12 / statCards} key={i}>
              <Skeleton variant="rounded" height={90} animation="wave" />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filter bar */}
      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} animation="wave" />

      {/* Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Skeleton variant="rectangular" height={48} animation="wave" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={52}
            animation="wave"
            sx={{ mt: '1px', opacity: 1 - i * 0.08 }}
          />
        ))}
      </Paper>
    </Box>
  )
}

export function CardGridSkeleton({ cards = 6, columns = 3 }: { cards?: number; columns?: number }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} animation="wave" />
        <Skeleton variant="rounded" width={140} height={36} animation="wave" />
      </Box>

      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} animation="wave" />

      <Grid container spacing={3}>
        {Array.from({ length: cards }).map((_, i) => (
          <Grid item xs={12} sm={6} md={12 / columns} key={i}>
            <Skeleton variant="rounded" height={220} animation="wave" />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export function DetailPageSkeleton() {
  return (
    <Box>
      {/* Breadcrumb */}
      <Skeleton variant="text" width={300} height={24} sx={{ mb: 1 }} animation="wave" />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Skeleton variant="text" width={250} height={40} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} animation="wave" />
          <Skeleton variant="rounded" width={100} height={36} animation="wave" />
        </Box>
      </Box>

      {/* Content cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rounded" height={300} animation="wave" />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rounded" height={300} animation="wave" />
        </Grid>
      </Grid>
    </Box>
  )
}

export function ChatSkeleton() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} animation="wave" />
      </Box>

      {/* Context chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={100} height={32} animation="wave" />
        ))}
      </Box>

      {/* Chat area */}
      <Paper sx={{ p: 3, height: 400, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
              {i % 2 === 0 && <Skeleton variant="circular" width={36} height={36} animation="wave" />}
              <Skeleton variant="rounded" width="60%" height={60} animation="wave" />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Input */}
      <Skeleton variant="rounded" height={56} animation="wave" />
    </Box>
  )
}
