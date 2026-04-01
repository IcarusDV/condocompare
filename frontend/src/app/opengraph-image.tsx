import { ImageResponse } from 'next/og'

export const alt = 'CondoCompare - Gestão Inteligente de Seguro Condomínio'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: 'white',
              letterSpacing: -2,
            }}
          >
            CC
          </span>
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            letterSpacing: -2,
            marginBottom: 16,
          }}
        >
          CondoCompare
        </span>

        {/* Tagline */}
        <span
          style={{
            fontSize: 28,
            color: '#94a3b8',
            fontWeight: 400,
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Gestão Inteligente de Seguro Condomínio
        </span>

        {/* Accent line */}
        <div
          style={{
            width: 120,
            height: 4,
            borderRadius: 2,
            background: '#3b82f6',
            marginTop: 32,
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  )
}
