/** Camadas anti-bot do formulário de download de materiais.
 * Valores pensados para serem fáceis de ajustar sem tocar na lógica. */
export const antiBotConfig = {
  /** Envios mais rápidos que isso (desde a abertura do modal) são tratados como bot. */
  minFillTimeMs: 2500,
  rateLimit: {
    perIpPerHour: 5,
    perIpPerDay: 20,
  },
  /** Domínios de e-mail temporário/descartável conhecidos. */
  disposableEmailDomains: [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.info",
    "10minutemail.com",
    "10minutemail.net",
    "temp-mail.org",
    "tempmail.com",
    "yopmail.com",
    "trashmail.com",
    "throwawaymail.com",
    "discard.email",
    "fakeinbox.com",
    "getnada.com",
    "sharklasers.com",
    "maildrop.cc",
    "mintemail.com",
    "dispostable.com",
    "mailnesia.com",
    "moakt.com",
  ],
} as const;
