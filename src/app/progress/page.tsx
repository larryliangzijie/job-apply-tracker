import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { JtAppShell } from "@/components/jt/app-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "我的秋招进度",
  description: "记录待投递、笔试、面试和 Offer 进度",
};

const STATUS = ["待投递", "已投递", "笔试/测评", "一面", "二面", "HR面/终面", "Offer", "拒绝", "已撤回"];

type ProgressRow = {
  id: string;
  company: string;
  position: string;
  category: string | null;
  location: string | null;
  priority: string | null;
  apply_url: string | null;
  status: string;
  applied_date: string | null;
  latest_feedback: string | null;
  next_action: string | null;
  next_action_date: string | null;
  updated_at: string;
};

async function updateProgress(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "待投递");
  const nextAction = String(formData.get("next_action") || "") || null;
  const nextActionDate = String(formData.get("next_action_date") || "") || null;
  const latestFeedback = String(formData.get("latest_feedback") || "") || null;
  const today = new Date().toISOString().slice(0, 10);
  const payload: Record<string, unknown> = {
    status,
    next_action: nextAction,
    next_action_date: nextActionDate,
    latest_feedback: latestFeedback,
    updated_at: new Date().toISOString(),
  };
  if (status === "已投递") payload.applied_date = today;
  const db = supabase as any;
  const { error } = await db.from("application_progress").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/progress");
  revalidatePath("/jobs");
}

async function removeProgress(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id") || "");
  const db = supabase as any;
  const { error } = await db.from("application_progress").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/progress");
  revalidatePath("/jobs");
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const db = supabase as any;
  const { data, error } = await db.from("application_progress").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data || []) as ProgressRow[];

  const counts = Object.fromEntries(STATUS.map((s) => [s, rows.filter((r) => r.status === s).length]));

  return (
    <JtAppShell user={user}>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--jt-text-3)", marginBottom: 6 }}>PERSONAL PIPELINE</div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>我的秋招进度</h1>
            <p style={{ color: "var(--jt-text-2)", marginTop: 8 }}>这里的数据不会被每周岗位更新覆盖。每一家公司都可以独立记录阶段、反馈和下一步。</p>
          </div>
          <Link href="/jobs" style={buttonStyle}>返回岗位池</Link>
        </div>

        <section style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0" }}>
          {STATUS.map((s) => <div key={s} style={{ padding: "8px 11px", borderRadius: 999, background: "var(--jt-bg-sunk)", border: "1px solid var(--jt-border)", fontSize: 12 }}><strong>{counts[s]}</strong> {s}</div>)}
        </section>

        {rows.length === 0 ? (
          <div style={{ border: "1px dashed var(--jt-border)", borderRadius: 14, padding: 40, textAlign: "center", color: "var(--jt-text-2)" }}>
            还没有加入岗位。先去 <Link href="/jobs" style={{ textDecoration: "underline" }}>秋招岗位池</Link> 选择想投的公司。
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row) => (
              <article key={row.id} style={{ border: "1px solid var(--jt-border)", borderRadius: 14, background: "var(--jt-bg-elev)", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 17 }}>{row.company}</strong>
                      {row.priority && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "var(--jt-bg-sunk)" }}>{row.priority}级</span>}
                    </div>
                    <div style={{ color: "var(--jt-text-2)", marginTop: 5, lineHeight: 1.5 }}>{row.position}</div>
                    <div style={{ color: "var(--jt-text-3)", fontSize: 12, marginTop: 5 }}>{row.category || '—'} · {row.location || '—'}</div>
                  </div>
                  {row.apply_url && <a href={row.apply_url} target="_blank" rel="noreferrer" style={secondaryButtonStyle}>打开投递页</a>}
                </div>

                <form action={updateProgress} style={{ display: "grid", gridTemplateColumns: "minmax(150px,190px) 1fr minmax(150px,190px) 1fr auto", gap: 9, marginTop: 14, alignItems: "end" }}>
                  <input type="hidden" name="id" value={row.id} />
                  <label style={labelStyle}>当前阶段
                    <select name="status" defaultValue={row.status} style={inputStyle}>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  </label>
                  <label style={labelStyle}>最新反馈
                    <input name="latest_feedback" defaultValue={row.latest_feedback || ''} placeholder="例如：HR 已约一面" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>下一步日期
                    <input type="date" name="next_action_date" defaultValue={row.next_action_date || ''} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>下一步行动
                    <input name="next_action" defaultValue={row.next_action || ''} placeholder="准备笔试 / 跟进 HR" style={inputStyle} />
                  </label>
                  <button type="submit" style={{ ...buttonStyle, border: 0, cursor: "pointer", height: 37 }}>保存</button>
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, color: "var(--jt-text-3)", fontSize: 11 }}>
                  <span>最近更新 {new Date(row.updated_at).toLocaleString('zh-CN')}</span>
                  <form action={removeProgress}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" style={{ border: 0, background: "transparent", color: "var(--jt-text-3)", cursor: "pointer", fontSize: 11 }}>移出跟踪</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </JtAppShell>
  );
}

const labelStyle: React.CSSProperties = { display: "grid", gap: 5, fontSize: 11, color: "var(--jt-text-3)" };
const inputStyle: React.CSSProperties = { width: "100%", height: 37, padding: "0 9px", borderRadius: 8, border: "1px solid var(--jt-border)", background: "var(--jt-bg)", color: "var(--jt-text)", fontSize: 12 };
const buttonStyle: React.CSSProperties = { display: "inline-block", padding: "9px 12px", borderRadius: 8, background: "var(--p-600)", color: "white", textDecoration: "none", fontSize: 12, fontWeight: 650, textAlign: "center" };
const secondaryButtonStyle: React.CSSProperties = { display: "inline-block", padding: "8px 11px", borderRadius: 8, background: "var(--jt-bg-sunk)", color: "var(--jt-text)", border: "1px solid var(--jt-border)", textDecoration: "none", fontSize: 12, fontWeight: 600 };
