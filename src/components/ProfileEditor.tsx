"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type PhoneResource = Awaited<ReturnType<ClerkUser["createPhoneNumber"]>>;
type PhoneStep = "edit" | "verify";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function ProfileForm({ user }: { user: ClerkUser }) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.primaryPhoneNumber?.phoneNumber ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("edit");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const phoneResource = useRef<PhoneResource | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  const showError = (value: unknown) => {
    setMessage("");
    setError(getErrorMessage(value));
  };

  async function saveProfile() {
    setError("");
    setMessage("");

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    setIsSaving(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setMessage("Your profile details have been saved.");
    } catch (saveError) {
      showError(saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function startPhoneVerification() {
    setError("");
    setMessage("");
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number with its country code, such as +91 98765 43210.");
      return;
    }

    setIsSendingCode(true);
    try {
      const existingPhone = user.phoneNumbers.find(
        (phoneNumber) => phoneNumber.phoneNumber === normalizedPhone,
      );

      if (existingPhone?.verification.status === "verified") {
        await user.update({ primaryPhoneNumberId: existingPhone.id });
        await user.reload();
        setPhone(existingPhone.phoneNumber);
        setMessage("Your phone number is now saved as your primary number.");
        return;
      }

      const newPhone = existingPhone ?? await user.createPhoneNumber({ phoneNumber: normalizedPhone });
      phoneResource.current = newPhone;
      await newPhone.prepareVerification();
      setPhone(normalizedPhone);
      setPhoneStep("verify");
      setMessage(`We sent a verification code to ${normalizedPhone}.`);
    } catch (phoneError) {
      showError(phoneError);
    } finally {
      setIsSendingCode(false);
    }
  }

  async function verifyPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!phoneResource.current) {
      setError("Request a new code to continue.");
      setPhoneStep("edit");
      return;
    }
    if (!/^\d{4,8}$/.test(verificationCode.trim())) {
      setError("Enter the verification code from your text message.");
      return;
    }

    setIsVerifying(true);
    try {
      const verifiedPhone = await phoneResource.current.attemptVerification({
        code: verificationCode.trim(),
      });
      await user.update({ primaryPhoneNumberId: verifiedPhone.id });
      await user.reload();
      setPhone(verifiedPhone.phoneNumber);
      setVerificationCode("");
      phoneResource.current = null;
      setPhoneStep("edit");
      setMessage("Your phone number has been verified and saved.");
    } catch (verificationError) {
      showError(verificationError);
    } finally {
      setIsVerifying(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file to use as your profile photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      setMessage("Your profile photo has been updated.");
    } catch (photoError) {
      showError(photoError);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "No email address";
  const phoneIsVerified = user.primaryPhoneNumber?.verification.status === "verified";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 22, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.4fr]"
    >
      <motion.aside
        initial={reduceMotion ? false : { opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08, duration: 0.65 }}
        whileHover={reduceMotion ? undefined : { y: -3 }}
        className="h-fit min-w-0 rounded-3xl bg-zinc-950 p-6 text-white shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.8, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/15 bg-zinc-800"
          >
            <Image
              src={user.imageUrl}
              alt={`${user.fullName ?? "Rider"} profile photo`}
              fill
              sizes="64px"
              unoptimized
              className="object-cover"
            />
          </motion.div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.fullName ?? "Your profile"}</p>
            <p className="mt-1 truncate text-sm text-zinc-400">{email}</p>
          </div>
        </div>
        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Profile checklist</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Name</span>
              <span className="text-emerald-300">{firstName.trim() ? "Added" : "Needed"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Email</span>
              <span className="text-emerald-300">{user.hasVerifiedEmailAddress ? "Verified" : "On account"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Phone</span>
              <span className={phoneIsVerified ? "text-emerald-300" : "text-zinc-400"}>
                {phoneIsVerified ? "Verified" : "Optional"}
              </span>
            </li>
          </ul>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">Your account, your way.</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Profile changes are saved securely to your signed-in account.
          </p>
        </div>
      </motion.aside>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.7 }}
        className="min-w-0 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-100 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Personal details</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950">Your rider profile</h2>
            <p className="mt-1 text-sm text-zinc-500">Make sure your details are current before your first ride.</p>
          </div>
          <motion.label
            htmlFor="profile-photo"
            whileHover={reduceMotion || isUploadingPhoto ? undefined : { y: -2, scale: 1.025 }}
            whileTap={reduceMotion || isUploadingPhoto ? undefined : { scale: 0.97 }}
            className={`inline-flex w-fit cursor-pointer items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 ${isUploadingPhoto ? "pointer-events-none opacity-60" : ""}`}
          >
            {isUploadingPhoto ? "Uploading…" : "Change photo"}
          </motion.label>
          <input
            ref={fileInput}
            id="profile-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={uploadPhoto}
            disabled={isUploadingPhoto}
          />
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-zinc-800">
              First name <span className="text-rose-600">*</span>
              <input
                type="text"
                autoComplete="given-name"
                maxLength={50}
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                placeholder="Your first name"
              />
            </label>
            <label className="block text-sm font-semibold text-zinc-800">
              Last name
              <input
                type="text"
                autoComplete="family-name"
                maxLength={50}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                placeholder="Your last name"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-zinc-800">
            Email address
            <input
              type="email"
              value={email}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-normal text-zinc-500"
            />
            <span className="mt-1.5 block text-xs font-normal text-zinc-500">
              Your sign-in email is managed through account security settings.
            </span>
          </label>

          <section className="rounded-2xl border border-zinc-200 p-4 sm:p-5" aria-labelledby="phone-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 id="phone-heading" className="text-sm font-semibold text-zinc-900">Phone number</h3>
                <p className="mt-1 text-xs text-zinc-500">Add a number with country code. We&apos;ll verify it by SMS.</p>
              </div>
              {phoneIsVerified && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {phoneStep === "edit" ? (
              <motion.div
                key="phone-edit"
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  placeholder="+91 98765 43210"
                  aria-label="Phone number with country code"
                />
                <motion.button
                  type="button"
                  onClick={startPhoneVerification}
                  disabled={isSendingCode || !phone.trim()}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingCode ? "Sending code…" : phoneIsVerified ? "Update number" : "Verify number"}
                </motion.button>
              </motion.div>
              ) : (
              <motion.form
                key="phone-verify"
                onSubmit={verifyPhone}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={8}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm tracking-[0.25em] text-zinc-950 outline-none transition placeholder:tracking-normal placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  placeholder="SMS verification code"
                  aria-label="SMS verification code"
                />
                <motion.button
                  type="submit"
                  disabled={isVerifying || !verificationCode.trim()}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className="shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isVerifying ? "Verifying…" : "Confirm code"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    phoneResource.current = null;
                    setPhoneStep("edit");
                    setVerificationCode("");
                    setError("");
                    setMessage("");
                  }}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100"
                >
                  Change
                </button>
              </motion.form>
              )}
            </AnimatePresence>
          </section>

          <AnimatePresence mode="wait" initial={false}>
            {(error || message) && (
              <motion.div
                key={error ? "profile-error" : "profile-success"}
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                role={error ? "alert" : "status"}
                aria-live="polite"
                className={`rounded-xl px-4 py-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}
              >
                {error || message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">Your email address can&apos;t be changed here.</p>
            <motion.button
              type="button"
              onClick={saveProfile}
              disabled={isSaving || isSendingCode || isVerifying || isUploadingPhoto}
              whileHover={reduceMotion || isSaving ? undefined : { y: -2, scale: 1.015 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving changes…" : "Save changes"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProfileEditor() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="h-[520px] animate-pulse rounded-3xl bg-zinc-200" aria-label="Loading profile" />;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Sign in to view and edit your profile.
      </div>
    );
  }

  return <ProfileForm user={user} />;
}
