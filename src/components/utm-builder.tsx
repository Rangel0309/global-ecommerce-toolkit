"use client";

import { useMemo, useState } from "react";

export default function UtmBuilder() {
  const [baseUrl, setBaseUrl] = useState("https://example.com/products/product");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("product-test");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");

  const finalUrl = useMemo(() => {
    try {
      const url = new URL(baseUrl);
      const values = {
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        utm_content: content,
        utm_term: term,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value.trim()) url.searchParams.set(key, value.trim());
        else url.searchParams.delete(key);
      });

      return url.toString();
    } catch {
      return "";
    }
  }, [baseUrl, source, medium, campaign, content, term]);

  async function copyUrl() {
    if (!finalUrl) {
      setMessage("Enter a valid URL first.");
      return;
    }

    await navigator.clipboard.writeText(finalUrl);
    setMessage("UTM URL copied.");
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-blue-400/50";

  return (
    <section id="utm" className="scroll-mt-20 border-t border-white/10 py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-cyan-300">Acquisition utility</p>
        <h2 className="mt-2 text-2xl font-semibold">UTM builder</h2>
        <p className="mt-2 text-sm text-slate-500">
          Build consistent campaign URLs for Google Ads, Meta Ads and other traffic sources.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <label className="grid gap-2 text-sm text-slate-300">
          Destination URL
          <input
            className={inputClass}
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-2 text-sm text-slate-300">
            Source
            <input
              className={inputClass}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="google"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Medium
            <input
              className={inputClass}
              value={medium}
              onChange={(event) => setMedium(event.target.value)}
              placeholder="cpc"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Campaign
            <input
              className={inputClass}
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="black-friday"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Content
            <input
              className={inputClass}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="creative-a"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Term
            <input
              className={inputClass}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="keyword"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            Generated URL
          </p>
          <p className="mt-2 break-all text-sm text-slate-300">
            {finalUrl || "Enter a valid destination URL."}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={copyUrl}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
          >
            Copy URL
          </button>
          {message && <p className="text-xs text-slate-400">{message}</p>}
        </div>
      </div>
    </section>
  );
}
