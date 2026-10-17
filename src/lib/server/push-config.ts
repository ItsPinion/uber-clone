import webpush from "web-push";

export function getVapidConfiguration() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return { publicKey, privateKey, subject };
  } catch {
    return null;
  }
}
