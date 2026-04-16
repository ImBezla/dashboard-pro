import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** PNG-Tab-Icon — breite Client-Unterstützung (inkl. Safari). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: '#6366f1',
          borderRadius: 9,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingBottom: 6,
          }}
        >
          <div
            style={{
              width: 5,
              height: 8,
              marginRight: 4,
              background: '#ffffff',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 5,
              height: 13,
              marginRight: 4,
              background: '#ffffff',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 5,
              height: 19,
              background: '#ffffff',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
