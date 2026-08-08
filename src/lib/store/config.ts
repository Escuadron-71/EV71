const DEFAULT_STORE_WHATSAPP_NUMBER = "573000000000";

export function getStoreWhatsAppNumber(): string {
  const configured = import.meta.env.PUBLIC_WHATSAPP_NUMBER;
  return typeof configured === "string" && configured.trim().length > 0
    ? configured
    : DEFAULT_STORE_WHATSAPP_NUMBER;
}
