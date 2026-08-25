import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { JtAppShell } from "@/components/jt/app-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "2027 秋招岗位池",
  description: "市场营销、运营管理与管培生岗位池",
};

type JobRow = {
  id: string;
  company: string;
  position: string;
  category: string | null;
  industry: string | null;
  location: string | null;
  salary: string | null;
  batch: string | null;
  deadline: string | null;
  deadline_note: string | null;
  priority: string | null;
  match_score: number | null;
  recommendation: string | null;
  risk_note: string | null;
  apply_url: string | null;
  source_type: string | null;
  last_checked: string | null;
};

async function trackJob(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jobId = String(formData.get("job_id") || "");
  const company = String(formData.get("company") || "");
  const position = String(formData.get("position") || "");
  const category = String(formData.get("category") || "") || null;
  const location = String(formData.get("location") || "") || null;
  const priority = String(formData.get("priority") || "") || null;
  const applyUrl = String(formData.get("apply_url") || "") || null;

  const db = supabase as any;
  const { error } = await db.from("application_progress").upsert({
    user_id: user.id,
    job_listing_id: jobId || null,
    company,
    position,
    category,
    location,
    priority,
    apply_url: applyUrl,
    status: "待投递",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,company,position" });
  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/progress");
}

function daysUntil(date: string | null) {
  if (!date) return null;
  const now = new Date();
  const end = new Date(`${date}T23:59:59`);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = supabase as any;
  const [{ data: jobsRaw, error }, { data: trackedRaw }] = await Promise.all([
    db.from("job_listings").select("*").eq("active", true).order("match_score", { ascending: false }).order("deadline", { ascending: true, nullsFirst: false }),
    db.from("application_progress").select("job_listing_id,company,position,status").eq("user_id", user.id),
  ]);
  if (error) throw error;

  const jobs = (jobsRaw || []) as JobRow[];
  const tracked = new Set((trackedRaw || []).map((x: any) => x.job_listing_id || `${x.company}__${x.position}`));
  const sCount = jobs.filter((j) => j.priority === "S").length;
  const aCount = jobs.filter((j) => j.priority === "A").length;
  const urgent = jobs.filter((j) => {
    const d = daysUntil(j.deadline);
    return d !== null && d >= 0 && d <= 14;
  }).length;

  return (
    <JtAppShell user={user}>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px 96px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--jt-text-3)", marginBottom: 6 }}>2027 CAMPUS RECRUITMENT</div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>秋招岗位池</h1>
            <p style={{ color: "var(--jt-text-2)", marginTop: 8, maxWidth: 720 }}>只保留市场营销、品牌、内容/社媒、增长、电商、运营管理以及适合的管培生方向；技术、研发、算法、工程类岗位排除。</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/progress" style={buttonStyle}>我的申请进度</Link>
            <Link href="/applications" style={secondaryButtonStyle}>JobTrack 原申请</Link>
          </div>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, margin: "22px 0" }}>
          <Stat label="当前岗位" value={jobs.length} />
          <Stat label="S 级高匹配" value={sCount} />
          <Stat label="A 级" value={aCount} />
          <Stat label="14天内截止" value={urgent} />
        </section>

        <div style={{ overflowX: "auto", border: "1px solid var(--jt-border)", borderRadius: 14, background: "var(--jt-bg-elev)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
            <thead>
              <tr style={{ background: "var(--jt-bg-sunk)", textAlign: "left", fontSize: 12, color: "var(--jt-text-3)" }}>
                {['优先级','公司 / 岗位','方向','地点','匹配度','截止','推荐理由','操作'].map((h) => <th key={h} style={{ padding: "11px 12px", borderBottom: "1px solid var(--jt-border)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const key = job.id || `${job.company}__${job.position}`;
                const isTracked = tracked.has(key) || tracked.has(`${job.company}__${job.position}`);
                const left = daysUntil(job.deadline);
                return (
                  <tr key={job.id} style={{ verticalAlign: "top" }}>
                    <td style={cellStyle}><Priority value={job.priority} /></td>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 650, marginBottom: 5 }}>{job.company}</div>
                      <div style={{ color: "var(--jt-text-2)", lineHeight: 1.55, maxWidth: 330 }}>{job.position}</div>
                      <div style={{ fontSize: 11, color: "var(--jt-text-3)", marginTop: 6 }}>{job.source_type || '待核验'} · 核验 {job.last_checked || '—'}</div>
                    </td>
                    <td style={cellStyle}>{job.category || '—'}</td>
                    <td style={cellStyle}>{job.location || '—'}</td>
                    <td style={cellStyle}><strong>{job.match_score ?? '—'}</strong>{job.match_score != null ? '/100' : ''}</td>
                    <td style={cellStyle}>
                      <div>{job.deadline || '暂未公布'}</div>
                      {left !== null && left >= 0 && <div style={{ fontSize: 11, marginTop: 4, color: left <= 7 ? '#dc2626' : 'var(--jt-text-3)' }}>{left} 天</div>}
                    </td>
                    <td style={{ ...cellStyle, maxWidth: 290, lineHeight: 1.55 }}>{job.recommendation || '—'}{job.risk_note && <div style={{ color: "var(--jt-text-3)", fontSize: 12, marginTop: 5 }}>注意：{job.risk_note}</div>}</td>
                    <td style={cellStyle}>
                      <div style={{ display: "grid", gap: 7, minWidth: 112 }}>
                        {job.apply_url && <a href={job.apply_url} target="_blank" rel="noreferrer" style={secondaryButtonStyle}>去投递</a>}
                        {isTracked ? (
                          <Link href="/progress" style={{ ...buttonStyle, textAlign: "center", opacity: .72 }}>已加入</Link>
                        ) : (
                          <form action={trackJob}>
                            <input type="hidden" name="job_id" value={job.id} />
                            <input type="hidden" name="company" value={job.company} />
                            <input type="hidden" name="position" value={job.position} />
                            <input type="hidden" name="category" value={job.category || ''} />
                            <input type="hidden" name="location" value={job.location || ''} />
                            <input type="hidden" name="priority" value={job.priority || ''} />
                            <input type="hidden" name="apply_url" value={job.apply_url || ''} />
                            <button type="submit" style={{ ...buttonStyle, border: 0, width: "100%", cursor: "pointer" }}>加入进度</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </JtAppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div style={{ padding: "16px 18px", border: "1px solid var(--jt-border)", borderRadius: 12, background: "var(--jt-bg-elev)" }}><div style={{ fontSize: 12, color: "var(--jt-text-3)" }}>{label}</div><div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div></div>;
}
function Priority({ value }: { value: string | null }) {
  const bg = value === 'S' ? '#fee2e2' : value === 'A' ? '#fef3c7' : '#e5e7eb';
  const fg = value === 'S' ? '#b91c1c' : value === 'A' ? '#92400e' : '#374151';
  return <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, background: bg, color: fg, fontWeight: 800, fontSize: 12 }}>{value || '—'}</span>;
}

const cellStyle: React.CSSProperties = { padding: "14px 12px", borderBottom: "1px solid var(--jt-border)", fontSize: 13 };
const buttonStyle: React.CSSProperties = { display: "inline-block", padding: "8px 11px", borderRadius: 8, background: "var(--p-600)", color: "white", textDecoration: "none", fontSize: 12, fontWeight: 650 };
const secondaryButtonStyle: React.CSSProperties = { display: "inline-block", padding: "8px 11px", borderRadius: 8, background: "var(--jt-bg-sunk)", color: "var(--jt-text)", border: "1px solid var(--jt-border)", textDecoration: "none", fontSize: 12, fontWeight: 600, textAlign: "center" };
