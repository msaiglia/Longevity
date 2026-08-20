import { resend, EMAIL_FROM } from "@/lib/resend";

function shell(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `
  <div style="background:#f5f8fa;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dfe7ec;">
      <div style="background:#0b2e4e;padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;">Longevity</span>
      </div>
      <div style="padding:28px;">
        <h1 style="font-size:19px;color:#0f1f2e;margin:0 0 14px;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#354a5c;">${bodyHtml}</div>
        ${
          ctaLabel && ctaUrl
            ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:22px;background:#1c6fb0;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:500;">${ctaLabel}</a>`
            : ""
        }
      </div>
      <div style="padding:16px 28px;background:#f5f8fa;font-size:12px;color:#5c7080;">
        Corso Longevity — Dott. Carlo Poggioli
      </div>
    </div>
  </div>`;
}

export async function sendApprovalEmail(to: string, firstName: string) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Il tuo account Longevity è stato approvato",
    html: shell(
      `Benvenuto/a, ${firstName}`,
      `Il tuo account è stato approvato dallo staff. Da ora puoi accedere e prenotare le sessioni del corso disponibili.`,
      "Vai alle prenotazioni",
      `${process.env.NEXT_PUBLIC_APP_URL}/prenota`,
    ),
  });
}

export async function sendRejectionEmail(to: string, firstName: string) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Aggiornamento sulla tua richiesta di iscrizione",
    html: shell(
      `Ciao ${firstName}`,
      `Al momento non è stato possibile approvare la tua richiesta di iscrizione al corso. Per informazioni contatta la reception del centro.`,
    ),
  });
}

export async function sendBookingConfirmationEmail(
  to: string,
  firstName: string,
  dateLabel: string,
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Prenotazione confermata",
    html: shell(
      `Prenotazione confermata`,
      `Ciao ${firstName}, la tua prenotazione per <strong>${dateLabel}</strong> è confermata. Ti aspettiamo!`,
      "Le mie prenotazioni",
      `${process.env.NEXT_PUBLIC_APP_URL}/le-mie-prenotazioni`,
    ),
  });
}

export async function sendCancellationEmail(
  to: string,
  firstName: string,
  dateLabel: string,
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Prenotazione cancellata",
    html: shell(
      `Prenotazione cancellata`,
      `Ciao ${firstName}, la tua prenotazione per <strong>${dateLabel}</strong> è stata cancellata.`,
      "Prenota un'altra sessione",
      `${process.env.NEXT_PUBLIC_APP_URL}/prenota`,
    ),
  });
}

export async function sendWaitlistPromotionEmail(
  to: string,
  firstName: string,
  dateLabel: string,
  expiresMinutes: number,
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Si è liberato un posto per te",
    html: shell(
      `Si è liberato un posto`,
      `Ciao ${firstName}, si è liberato un posto per la sessione del <strong>${dateLabel}</strong>. Hai <strong>${expiresMinutes} minuti</strong> per confermare, poi il posto passa al prossimo in lista.`,
      "Conferma il posto",
      `${process.env.NEXT_PUBLIC_APP_URL}/prenota`,
    ),
  });
}

export async function sendReminderEmail(to: string, firstName: string, dateLabel: string) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Promemoria: la tua sessione è oggi",
    html: shell(
      `Promemoria sessione`,
      `Ciao ${firstName}, ti ricordiamo la tua sessione di oggi alle <strong>${dateLabel}</strong>.`,
    ),
  });
}

export async function sendNewMessageEmail(
  to: string,
  firstName: string,
  title: string,
  preview: string,
) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Nuovo messaggio: ${title}`,
    html: shell(
      title,
      `Ciao ${firstName}, hai ricevuto una nuova comunicazione dallo staff:<br/><br/><em>${preview}</em>`,
      "Leggi il messaggio",
      `${process.env.NEXT_PUBLIC_APP_URL}/comunicazioni`,
    ),
  });
}
