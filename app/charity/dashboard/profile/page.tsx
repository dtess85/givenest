"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CharityProfileEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    tagline: "",
    description: "",
    mission: "",
    website: "",
    video_url: "",
    cover_image_url: "",
    logo_url: "",
  });

  useEffect(() => {
    fetch("/api/charity/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.charity) {
          setForm({
            tagline: data.charity.tagline ?? "",
            description: data.charity.description ?? "",
            mission: data.charity.mission ?? "",
            website: data.charity.website ?? "",
            video_url: data.charity.video_url ?? "",
            cover_image_url: data.charity.cover_image_url ?? "",
            logo_url: data.charity.logo_url ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, field: "cover_image_url" | "logo_url") {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = field === "cover_image_url" ? setUploadingCover : setUploadingLogo;
    setter(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("field", field);
    const res = await fetch("/api/charity/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, [field]: data.url }));
    setter(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/charity/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      <div className="border-b border-border bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-sans text-[16px] font-medium">give<span className="text-coral">nest</span></a>
            <span className="text-border">|</span>
            <Link href="/charity/dashboard" className="text-[13px] text-muted hover:text-black">Dashboard</Link>
            <span className="text-border">/</span>
            <span className="text-[13px]">Edit profile</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[760px] px-8 py-10">
        <h1 className="mb-8 font-serif text-[28px] font-medium tracking-[-0.01em]">Edit profile</h1>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Cover image */}
          <div className="rounded-[10px] border border-border bg-white p-6">
            <label className="mb-3 block text-[13px] font-medium">Cover image</label>
            {form.cover_image_url && (
              <div className="mb-3 overflow-hidden rounded-[8px] border border-border" style={{ aspectRatio: "16/5" }}>
                <img src={form.cover_image_url} alt="Cover" className="h-full w-full object-cover" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "cover_image_url")} className="text-[13px]" />
            {uploadingCover && <p className="mt-1 text-[12px] text-muted">Uploading...</p>}
          </div>

          {/* Logo */}
          <div className="rounded-[10px] border border-border bg-white p-6">
            <label className="mb-3 block text-[13px] font-medium">Logo</label>
            {form.logo_url && (
              <div className="mb-3 h-[64px] w-[64px] overflow-hidden rounded-[8px] border border-border">
                <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "logo_url")} className="text-[13px]" />
            {uploadingLogo && <p className="mt-1 text-[12px] text-muted">Uploading...</p>}
          </div>

          {/* Text fields */}
          {[
            { field: "tagline", label: "Tagline", placeholder: "A short one-liner about your org", type: "input" },
            { field: "description", label: "Description", placeholder: "Tell your story...", type: "textarea" },
            { field: "mission", label: "Mission statement", placeholder: "Your mission in one paragraph", type: "textarea" },
            { field: "website", label: "Website URL", placeholder: "https://yourorg.org", type: "input" },
            { field: "video_url", label: "Video URL (YouTube or Vimeo)", placeholder: "https://youtube.com/watch?v=...", type: "input" },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field} className="rounded-[10px] border border-border bg-white p-6">
              <label className="mb-2 block text-[13px] font-medium">{label}</label>
              {type === "textarea" ? (
                <textarea
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  rows={4}
                  className="w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] font-light outline-none placeholder:text-muted/50 focus:border-coral"
                />
              ) : (
                <input
                  type="text"
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-md border border-border bg-[#faf9f7] px-3 py-2 text-[14px] font-light outline-none placeholder:text-muted/50 focus:border-coral"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-coral px-6 py-[12px] text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] disabled:opacity-60"
          >
            {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
