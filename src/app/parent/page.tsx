"use client";

import { useMemo, useState } from "react";
import { curriculum } from "@/content/curriculum";
import { srsStats } from "@/lib/progress/srs";
import { progressActions, useProgress } from "@/lib/progress/store";
import { BigButton } from "@/components/common/common";

/** 家长页：算术门 → 报告 + 设置（M1 基础版，M4 完整） */
export default function Page() {
  const [unlocked, setUnlocked] = useState(false);
  const p = useProgress();
  const stats = useMemo(() => srsStats(p.srs), [p.srs]);

  if (!unlocked) {
    return <Gate onPass={() => setUnlocked(true)} />;
  }

  const totalLessons = curriculum.units.reduce((n, u) => n + u.lessons.length, 0);
  const doneLessons = Object.keys(p.lessons).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-700">👨‍👩‍👧 家长中心 Parent</h1>
        <button onClick={() => setUnlocked(false)} className="text-sm font-bold text-slate-500">
          锁定 Lock
        </button>
      </header>

      {/* 概览 */}
      <section className="mb-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="总星星 Stars" value={p.stars} />
        <Stat label="连续打卡 Streak" value={`${p.streak.current} 天`} />
        <Stat label="最长纪录 Best" value={`${p.streak.longest} 天`} />
        <Stat label="完成课程 Lessons" value={`${doneLessons}/${totalLessons}`} />
        <Stat label="解锁单元 Units" value={`${p.maxUnlockedUnitIndex + 1}/${curriculum.units.length}`} />
        <Stat label="已读故事 Stories" value={Object.keys(p.stories).length} />
      </section>

      {/* 记忆报告 */}
      <section className="mb-5 rounded-3xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-black text-slate-700">单词记忆报告 Memory Report</h2>
        <div className="mb-3 flex h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="bg-mint" style={{ width: `${pct(stats.mastered, stats)}%` }} />
          <div className="bg-butter" style={{ width: `${pct(stats.review, stats)}%` }} />
          <div className="bg-coral" style={{ width: `${pct(stats.learning, stats)}%` }} />
        </div>
        <ul className="text-sm font-medium text-slate-500">
          <li>🌱 已掌握 Mastered：{stats.mastered}</li>
          <li>🔁 复习中 Reviewing：{stats.review}</li>
          <li>📖 学习中 Learning：{stats.learning}</li>
          <li>⏰ 今日到期 Due today：{stats.dueToday}</li>
          <li>📝 错词本 Wrong words：{p.wrongWords.length}</li>
        </ul>
      </section>

      {/* 单元完成度 */}
      <section className="mb-5 rounded-3xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-black text-slate-700">单元进度 Units</h2>
        <div className="flex flex-col gap-2">
          {curriculum.units.map((u) => {
            const stars = u.lessons.reduce((n, l) => n + (p.lessons[l.id]?.stars ?? 0), 0);
            const max = u.lessons.length * 3;
            return (
              <div key={u.id} className="flex items-center gap-2 text-sm font-bold">
                <span className="w-7 text-center">{u.emoji}</span>
                <span className="w-28 shrink-0 truncate text-slate-600">{u.title}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-grape" style={{ width: `${(stars / max) * 100}%` }} />
                </div>
                <span className="w-12 text-right text-slate-500">
                  {stars}/{max}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 设置 */}
      <section className="rounded-3xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-black text-slate-700">设置 Settings</h2>
        <label className="mb-4 flex items-center gap-3">
          <span className="w-24 font-bold text-slate-500">孩子昵称</span>
          <input
            value={p.childName}
            onChange={(e) => progressActions.setChildName(e.target.value)}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 outline-none"
            placeholder="小朋友"
          />
        </label>

        <BackupPanel />

        <div className="mt-3 flex flex-col gap-2">
          <BigButton
            zh="解锁下一单元（孩子已掌握当前单元时用）"
            en="Unlock next unit"
            className="text-base"
            onClick={() => progressActions.unlockUnit(p.maxUnlockedUnitIndex + 1)}
          />
          <BigButton
            zh="重置全部进度"
            en="Reset all"
            className="bg-coral/90 text-base text-white"
            onClick={() => {
              if (confirm("确定重置全部学习进度吗？此操作不可恢复。")) progressActions.reset();
            }}
          />
        </div>
      </section>
    </div>
  );
}

function pct(n: number, s: ReturnType<typeof srsStats>) {
  const total = s.new + s.learning + s.review + s.mastered;
  return total === 0 ? 0 : (n / total) * 100;
}

/** 进度备份：导出（进度 + 自定义绘本 → 复制/下载 JSON）/ 导入（粘贴 JSON 恢复） */
function BackupPanel() {
  const [open, setOpen] = useState<"none" | "export" | "import">("none");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const exportData = () =>
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        progress: JSON.parse(localStorage.getItem("wai-en-progress") ?? "{}"),
        customStories: JSON.parse(localStorage.getItem("wai-en-custom-stories") ?? "[]"),
      },
      null,
      0,
    );

  const doExport = async () => {
    const data = exportData();
    setText(data);
    setOpen("export");
    setMsg("");
    try {
      await navigator.clipboard.writeText(data);
      setMsg("已复制到剪贴板 Copied! 也可保存下面的文本");
    } catch {
      setMsg("请手动全选复制下面的文本 Select & copy below");
    }
  };

  const doImport = () => {
    try {
      const parsed = JSON.parse(text) as {
        progress?: Record<string, unknown>;
        customStories?: unknown[];
      };
      if (!parsed.progress || typeof parsed.progress !== "object") {
        setMsg("格式不对：这不是本站导出的备份文件");
        return;
      }
      if (!confirm("导入会覆盖本机当前进度和自定义绘本，确定吗？")) return;
      localStorage.setItem("wai-en-progress", JSON.stringify(parsed.progress));
      localStorage.setItem(
        "wai-en-custom-stories",
        JSON.stringify(parsed.customStories ?? []),
      );
      setMsg("导入成功！即将刷新页面…");
      setTimeout(() => location.reload(), 800);
    } catch {
      setMsg("解析失败：请粘贴完整的备份文本");
    }
  };

  return (
    <div className="mb-3 rounded-2xl bg-sky-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-black text-slate-600">
          📦 数据备份 Backup（换设备前先导出）
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={doExport} className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow">
          导出 Export
        </button>
        <button
          onClick={() => (open === "import" ? setOpen("none") : (setText(""), setOpen("import"), setMsg("")))}
          className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow"
        >
          导入 Import
        </button>
        {open !== "none" && (
          <button onClick={() => setOpen("none")} className="text-sm font-bold text-slate-500">
            收起
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-xs font-bold text-sky-600">{msg}</p>}
      {open !== "none" && (
        <div className="mt-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={open === "export"}
            rows={4}
            placeholder={open === "import" ? "把之前导出的备份文本粘贴到这里…" : ""}
            className="w-full rounded-xl bg-white p-3 font-mono text-[10px] text-slate-600 outline-none"
          />
          {open === "import" && (
            <button
              onClick={doImport}
              className="mt-2 w-full rounded-full bg-grape py-3 text-sm font-black text-white shadow"
            >
              覆盖导入 Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="text-xl font-black text-grape">{value}</div>
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
    </div>
  );
}

/** 随机题在模块加载时生成（渲染期不可调用不纯函数）；答错时在事件里换题 */
function makeGate() {
  return {
    a: 1 + Math.floor(Math.random() * 48),
    b: 11 + Math.floor(Math.random() * 48),
  };
}
const INITIAL_GATE = makeGate();

function Gate({ onPass }: { onPass: () => void }) {
  const [gate, setGate] = useState(INITIAL_GATE);
  const [ans, setAns] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-4 py-28 text-center">
      <span className="text-6xl">🔐</span>
      <h1 className="text-xl font-black text-slate-600">家长验证</h1>
      <p className="font-medium text-slate-500">请回答：{gate.a} + {gate.b} = ?</p>
      <input
        inputMode="numeric"
        value={ans}
        onChange={(e) => setAns(e.target.value)}
        className="w-32 rounded-xl bg-white px-4 py-3 text-center text-2xl font-black text-slate-700 shadow outline-none"
        placeholder="?"
      />
      {err && <p className="text-sm font-bold text-coral">不对哦，再试试</p>}
      <BigButton
        zh="进入"
        en="Enter"
        className="bg-grape text-white"
        onClick={() =>
          Number(ans) === gate.a + gate.b
            ? onPass()
            : (setErr(true), setAns(""), setGate(makeGate()))
        }
      />
    </div>
  );
}
