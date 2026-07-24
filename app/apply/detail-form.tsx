"use client";

import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveDraft, submitApplication, type ApplyState, type DraftState } from "./actions";

const INPUT =
  "mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none";
const LABEL = "text-[0.8125rem] font-medium text-[var(--text-secondary)]";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Draft = Record<string, any>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-[var(--border-subtle)] pt-6">
      <legend className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function DocUpload({
  name,
  label,
  userId,
  initial,
  required,
}: {
  name: string;
  label: string;
  userId: string;
  initial?: string | null;
  required?: boolean;
}) {
  const [path, setPath] = useState<string>(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("File must be under 5 MB.");
      return;
    }
    setErr("");
    setBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "dat";
    const key = `${userId}/${name}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("provider-docs")
      .upload(key, file, { upsert: true });
    setBusy(false);
    if (error) {
      setErr("Upload failed. Try again.");
      return;
    }
    setPath(key);
  }

  return (
    <div>
      <label className={LABEL}>
        {label} {required && <span className="text-[var(--text-danger)]">*</span>}
      </label>
      <input type="hidden" name={name} value={path} />
      <label
        className="mt-1 flex h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-dashed px-3 text-[0.875rem]"
        style={{ borderColor: path ? "var(--border-brand)" : "var(--border-control)" }}
      >
        {busy ? (
          <><Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /> Uploading…</>
        ) : path ? (
          <><CheckCircle2 size={16} color="var(--text-success)" /> <span className="text-[var(--text-success)]">Uploaded</span> <span className="text-[var(--text-muted)]">— replace</span></>
        ) : (
          <><Upload size={16} className="text-[var(--text-muted)]" /> <span className="text-[var(--text-muted)]">Choose a file (PDF or image, max 5 MB)</span></>
        )}
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
      </label>
      {err && <p className="mt-1 text-[0.75rem] text-[var(--text-danger)]">{err}</p>}
    </div>
  );
}

function Buttons({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-3 border-t border-[var(--border-subtle)] pt-6">
      <button
        type="submit" name="intent" value="draft" disabled={pending}
        className="h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--border-control)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] disabled:opacity-60"
      >
        Save draft
      </button>
      <button
        type="submit" name="intent" value="submit" disabled={pending || disabled}
        className="h-11 flex-1 rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
      >
        {pending ? "Working…" : "Submit application"}
      </button>
    </div>
  );
}

export function DetailForm({ draft, userId }: { draft: Draft; userId: string }) {
  // One form, two server actions chosen by the clicked button's `intent`.
  const [submitState, submitAction] = useActionState<ApplyState, FormData>(submitApplication, null);
  const [draftState, draftAction] = useActionState<DraftState, FormData>(saveDraft, null);

  const isHospital = draft.provider_type === "hospital";
  const isClinicOrHospital = draft.provider_type !== "solo";

  async function dispatch(formData: FormData) {
    if (formData.get("intent") === "submit") return submitAction(formData);
    return draftAction(formData);
  }

  return (
    <form action={dispatch} className="space-y-6">
      <Section title="Your profile">
        <div>
          <label htmlFor="full_name" className={LABEL}>Full name</label>
          <input id="full_name" name="full_name" defaultValue={draft.full_name ?? ""} className={INPUT} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={LABEL}>Phone number</label>
            <input id="phone" name="phone" type="tel" defaultValue={draft.phone ?? ""} className={INPUT} />
          </div>
          <div>
            <label htmlFor="years_experience" className={LABEL}>Years of experience</label>
            <input id="years_experience" name="years_experience" type="number" min={0} defaultValue={draft.years_experience ?? ""} className={INPUT} />
          </div>
        </div>
        <div>
          <label htmlFor="languages" className={LABEL}>Languages spoken <span className="font-normal text-[var(--text-muted)]">(comma separated)</span></label>
          <input id="languages" name="languages" defaultValue={(draft.languages ?? []).join(", ")} placeholder="English, Hindi" className={INPUT} />
        </div>
        <div>
          <label htmlFor="bio" className={LABEL}>Short professional bio</label>
          <textarea id="bio" name="bio" rows={3} defaultValue={draft.bio ?? ""}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" />
        </div>
      </Section>

      <Section title="Professional information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="specialty" className={LABEL}>Specialty</label>
            <input id="specialty" name="specialty" defaultValue={draft.specialty ?? ""} placeholder="e.g. Cardiology" className={INPUT} />
          </div>
          <div>
            <label htmlFor="consultation_fee" className={LABEL}>Consultation fee (₹)</label>
            <input id="consultation_fee" name="consultation_fee" type="number" min={0} defaultValue={draft.consultation_fee ?? 500} className={INPUT} />
          </div>
        </div>
        <div>
          <label htmlFor="registration_number" className={LABEL}>Medical registration number</label>
          <input id="registration_number" name="registration_number" defaultValue={draft.registration_number ?? ""} className={INPUT} />
        </div>
        <div>
          <label htmlFor="qualifications" className={LABEL}>Qualifications</label>
          <input id="qualifications" name="qualifications" defaultValue={draft.qualifications ?? ""} placeholder="MBBS, MD (Cardiology)" className={INPUT} />
        </div>
      </Section>

      <Section title={isClinicOrHospital ? "Clinic / hospital information" : "Practice information"}>
        <div>
          <label htmlFor="clinic_name" className={LABEL}>{isClinicOrHospital ? "Clinic / hospital name" : "Practice name"}</label>
          <input id="clinic_name" name="clinic_name" defaultValue={draft.clinic_name ?? ""} className={INPUT} />
        </div>
        <div>
          <label htmlFor="address_line" className={LABEL}>Address</label>
          <input id="address_line" name="address_line" defaultValue={draft.address_line ?? ""} className={INPUT} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={LABEL}>City</label>
            <input id="city" name="city" defaultValue={draft.city ?? ""} className={INPUT} />
          </div>
          <div>
            <label htmlFor="state" className={LABEL}>State</label>
            <input id="state" name="state" defaultValue={draft.state ?? ""} className={INPUT} />
          </div>
          <div>
            <label htmlFor="pin_code" className={LABEL}>PIN code</label>
            <input id="pin_code" name="pin_code" defaultValue={draft.pin_code ?? ""} className={INPUT} />
          </div>
        </div>
      </Section>

      <Section title="Verification documents">
        <DocUpload name="reg_cert_path" label="Medical registration certificate" userId={userId} initial={draft.reg_cert_path} required />
        <DocUpload name="gov_id_path" label="Government ID" userId={userId} initial={draft.gov_id_path} required />
        <DocUpload name="clinic_reg_path" label="Clinic registration (optional)" userId={userId} initial={draft.clinic_reg_path} />
        {isHospital && (
          <DocUpload name="hospital_reg_path" label="Hospital registration" userId={userId} initial={draft.hospital_reg_path} />
        )}
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          Documents are stored privately and used only to verify your credentials.
        </p>
      </Section>

      {submitState?.error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-danger)", background: "var(--bg-dangerSubtle)" }} role="alert">
          <AlertCircle size={16} color="var(--text-danger)" className="mt-0.5 shrink-0" aria-hidden />
          <span className="text-[var(--text-danger)]">{submitState.error}</span>
        </div>
      )}
      {draftState?.ok && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-brand)", background: "var(--bg-successSubtle)" }}>
          <CheckCircle2 size={16} color="var(--text-success)" aria-hidden />
          <span className="text-[var(--text-success)]">Draft saved. You can finish later.</span>
        </div>
      )}

      <Buttons />
    </form>
  );
}
