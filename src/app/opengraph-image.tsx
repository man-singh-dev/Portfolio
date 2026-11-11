import { ImageResponse } from "next/og";
import site from "@/data/site.json";

export const dynamic = "force-static";
export const alt = "Man Singh: systems + vision";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const lc = site.leetcode;
  const cf = site.codeforces;
  const merged = site.github.prs.filter((p) => !p.own && p.status === "merged").length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          color: "#ede9e1",
          padding: 64,
          fontFamily: "monospace",
          backgroundImage: "linear-gradient(rgba(237,233,225,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(237,233,225,.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#8f8d88" }}>
          <span>man-singh.sys</span>
          <span style={{ color: "#ffb224" }}>● systems + vision</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 190, fontWeight: 900, letterSpacing: -6, lineHeight: 0.9, fontFamily: "sans-serif" }}>MAN SINGH</div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#ffb224" }}>Backend Engineer · AI/ML Researcher · Competitive Programmer</div>
        </div>
        <div style={{ display: "flex", gap: 48, fontSize: 26, color: "#8f8d88" }}>
          <span>LeetCode {lc.contest?.rating}</span>
          <span>Codeforces max {cf.maxRating}</span>
          <span>{merged} merged OSS PRs</span>
          <span>IIIT Agartala</span>
        </div>
      </div>
    ),
    size,
  );
}
