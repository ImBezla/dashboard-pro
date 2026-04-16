import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const barBottom = 36;
  const gap = 10;
  const w = 22;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 55%,#7c3aed 100%)',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingBottom: barBottom,
          }}
        >
          <div
            style={{
              width: w,
              height: 44,
              marginRight: gap,
              background: '#ffffff',
              borderRadius: 8,
              opacity: 0.95,
            }}
          />
          <div
            style={{
              width: w,
              height: 72,
              marginRight: gap,
              background: '#ffffff',
              borderRadius: 8,
              opacity: 0.97,
            }}
          />
          <div
            style={{
              width: w,
              height: 104,
              background: '#ffffff',
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
