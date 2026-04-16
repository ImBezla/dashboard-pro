import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION_DE, SITE_NAME } from '@/lib/site-url';

export const runtime = 'edge';
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#312e81 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: '#6366f1',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              marginRight: 36,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 14 }}>
              <div style={{ width: 14, height: 22, marginRight: 8, background: '#fff', borderRadius: 4 }} />
              <div style={{ width: 14, height: 36, marginRight: 8, background: '#fff', borderRadius: 4 }} />
              <div style={{ width: 14, height: 52, background: '#fff', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: -2,
                lineHeight: 1.05,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 30,
                fontWeight: 500,
                color: '#cbd5e1',
                maxWidth: 900,
                lineHeight: 1.35,
              }}
            >
              {SITE_DESCRIPTION_DE}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
