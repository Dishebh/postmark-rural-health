export function maskEmail(email) {
  const [local, domain] = email.split("@");
  const domainParts = domain.split(".");
  const maskedLocal = local.slice(0, 2) + "****" + local.slice(-1);
  const maskedDomain = "****." + domainParts[domainParts.length - 1];
  return `${maskedLocal}@${maskedDomain}`;
}
