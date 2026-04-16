/**
 * Marken-HTML für Transaktions-Mails (Outlook/Gmail: Tabellen + Inline-Styles).
 * Kein externes Bild nötig — Logo bleibt auch bei blockierten Bildern lesbar.
 */

export function escapeHtmlPlain(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

/** 32×32 Balken-Mark (wie Favicon), nur HTML-Tabellen. */
export function emailBrandMarkHtml(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;width:32px;height:32px;background-color:#6366f1;border-radius:8px;vertical-align:middle;">
  <tr>
    <td align="center" valign="bottom" style="height:32px;padding:0 5px 5px;box-sizing:border-box;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
        <tr>
          <td style="width:5px;height:8px;background-color:#ffffff;border-radius:2px;line-height:8px;font-size:0;">&nbsp;</td>
          <td style="width:4px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="width:5px;height:13px;background-color:#ffffff;border-radius:2px;line-height:13px;font-size:0;">&nbsp;</td>
          <td style="width:4px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="width:5px;height:19px;background-color:#ffffff;border-radius:2px;line-height:19px;font-size:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

/**
 * Mark + „Dashboard“ + „PRO“ in einer Zeile.
 * - onDark: helle Schrift (für Indigo/Violett/Cyan/Dunkel-Verläufe)
 * - onWarm: dunkle Schrift (für Amber/orange Verläufe)
 */
export function emailBrandWordmarkRow(theme: 'onDark' | 'onWarm'): string {
  const mark = emailBrandMarkHtml();
  const dash =
    theme === 'onWarm'
      ? 'color:#451a03;font-size:19px;font-weight:700;letter-spacing:-0.02em;'
      : 'color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.02em;';
  const pro =
    theme === 'onWarm'
      ? 'color:#b45309;font-size:13px;font-weight:800;letter-spacing:0.06em;padding-left:5px;'
      : 'color:#e0e7ff;font-size:13px;font-weight:800;letter-spacing:0.06em;padding-left:5px;';

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
  <tr>
    <td style="vertical-align:middle;padding-right:10px;line-height:0;">${mark}</td>
    <td style="vertical-align:middle;font-family:${EMAIL_FONT_STACK};line-height:1.2;">
      <span style="${dash}">Dashboard</span><span style="${pro}">PRO</span>
    </td>
  </tr>
</table>`.trim();
}

export function layoutTransactionEmail(
  bodyInner: string,
  preheader: string,
  footerAppUrl: string,
): string {
  const safePre = escapeHtmlPlain(preheader);
  const base = footerAppUrl.replace(/\/$/, '');
  const safeUrl = escapeHtmlPlain(base);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title></title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${safePre}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            ${bodyInner}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0;text-align:center;font-family:${EMAIL_FONT_STACK};font-size:12px;line-height:1.55;color:#94a3b8;">
            <p style="margin:0 0 8px;">
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#6366f1;font-weight:600;text-decoration:none;">Dashboard Pro</a>
              · ${year}
            </p>
            <p style="margin:0;">Diese Nachricht wurde automatisch gesendet. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
