import type { Metadata } from "next";
import Link from "next/link";
import { JtApplicationsPage } from "@/components/jt/applications-page";

export const metadata: Metadata = {
  title: "我的申请 | 2027 秋招",
  description: "JobTrack 申请列表、看板和跟进提醒。",
};

export default function ApplicationsPage() {
  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 16px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/jobs" style={primaryLink}>2027 秋招岗位池</Link>
        <Link href="/progress" style={secondaryLink}>我的秋招进度</Link>
      </div>
      <JtApplicationsPage />
    </>
  );
}

const primaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--p-600)",
  color: "white",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 650,
};

const secondaryLink: React.CSSProperties = {
  ...primaryLink,
  background: "var(--jt-bg-sunk)",
  color: "var(--jt-text)",
  border: "1px solid var(--jt-border)",
};
