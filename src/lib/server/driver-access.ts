const configuredDrivers = () =>
  (process.env.CABBOOK_DRIVER_USER_IDS ?? "")
    .split(/[\s,]+/)
    .map((userId) => userId.trim())
    .filter(Boolean);

export function isDriverUser(userId: string) {
  return configuredDrivers().includes(userId);
}
