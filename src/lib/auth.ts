const ADMIN_EMAILS = new Set(["fearlessbeke2@gmail.com", "fearlessbeke7@gmail.com"]);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export { ADMIN_EMAILS };
