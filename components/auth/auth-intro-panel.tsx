import React from "react";
import {
  Sparkles,
  Layers,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  Users2,
  Terminal,
} from "lucide-react";

export function AuthIntroPanel() {
  return (
    <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 md:p-10 text-[#f4f2ff] font-['Inter_Tight',sans-serif] overflow-hidden">
      {/* Soft atmospheric background glow */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(141, 148, 255, 0.22) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(111, 120, 255, 0.16) 0%, transparent 70%)",
        }}
      />

      {/* Top Header Section */}
      <div className="relative z-10 space-y-4">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(196,178,255,0.25)] bg-[rgba(111,120,255,0.12)] text-[#c6b8ff] text-[11px] font-mono uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#8d94ff]" />
          <span>AI-Native Team Execution</span>
        </div>

        {/* Witty, Confident Headline */}
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f4f2ff] leading-snug">
          Where chaotic group chats turn into{" "}
          <span className="bg-gradient-to-r from-[#8d94ff] to-[#c6b8ff] bg-clip-text text-transparent">
            shipped deliverables.
          </span>
        </h2>

        {/* Personality-rich Description */}
        <p className="text-sm leading-relaxed text-[rgba(236,232,255,0.72)] max-w-lg">
          TaskPit is the execution layer built for student bodies, campus clubs,
          and fast-moving teams. Delegate work, automate follow-ups, and verify
          proof of work without having to dig through a 400-message WhatsApp search party.
        </p>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Card 1: Multi-Org */}
          <div className="p-3.5 rounded-[14px] border border-[rgba(196,178,255,0.14)] bg-[rgba(255,255,255,0.035)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-[6px] bg-[rgba(111,120,255,0.2)] text-[#8d94ff]">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold tracking-tight text-[#f4f2ff]">
                Multi-Org Isolation
              </h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[rgba(220,214,255,0.6)]">
              Lead your E-Cell, code for Robotics, and prep hackathons with one account.
              Roles stay completely isolated.
            </p>
          </div>

          {/* Card 2: AI Delegation */}
          <div className="p-3.5 rounded-[14px] border border-[rgba(196,178,255,0.14)] bg-[rgba(255,255,255,0.035)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-[6px] bg-[rgba(111,120,255,0.2)] text-[#8d94ff]">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold tracking-tight text-[#f4f2ff]">
                AI Delegation via MCP
              </h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[rgba(220,214,255,0.6)]">
              Delegate straight from Cursor or Claude Desktop. Dictate tasks in natural
              language; our MCP server creates and assigns them.
            </p>
          </div>

          {/* Card 3: Noise-Free Inboxes */}
          <div className="p-3.5 rounded-[14px] border border-[rgba(196,178,255,0.14)] bg-[rgba(255,255,255,0.035)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-[6px] bg-[rgba(111,120,255,0.2)] text-[#8d94ff]">
                <Inbox className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold tracking-tight text-[#f4f2ff]">
                Focused Inboxes
              </h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[rgba(220,214,255,0.6)]">
              No endless submenus. Members see exactly what they own, when it is due,
              and where to drop their submission.
            </p>
          </div>

          {/* Card 4: Audit Trails */}
          <div className="p-3.5 rounded-[14px] border border-[rgba(196,178,255,0.14)] bg-[rgba(255,255,255,0.035)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-[6px] bg-[rgba(111,120,255,0.2)] text-[#8d94ff]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold tracking-tight text-[#f4f2ff]">
                Receipts Included
              </h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[rgba(220,214,255,0.6)]">
              Submissions log timestamps, links, and review states. Complete audit
              trails mean zero debates about who delivered what.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Free Tier & Witty Quote */}
      <div className="relative z-10 space-y-3.5 pt-6 mt-6 border-t border-[rgba(196,178,255,0.12)]">
        {/* Free Tier Callout */}
        <div className="p-3 rounded-[12px] border border-[rgba(141,148,255,0.25)] bg-[rgba(111,120,255,0.08)] flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#8d94ff] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-[#f4f2ff]">
              100% Free for Student & Campus Communities
            </p>
            <p className="text-[11px] leading-relaxed text-[rgba(220,214,255,0.6)]">
              No trial countdowns, no credit card ambush, and no artificial member caps.
              Bring your entire committee onboard.
            </p>
          </div>
        </div>

        {/* Witty Quote */}
        <div className="pl-3 border-l-2 border-[#8d94ff]/40">
          <p className="text-[11.5px] italic text-[rgba(236,232,255,0.65)] leading-relaxed">
            &ldquo;We used to spend 4 hours every Sunday figuring out who had done what.
            Now our AI agent creates the tasks and people actually ship.&rdquo;
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[10.5px] font-mono text-[rgba(196,178,255,0.7)]">
            <Users2 className="w-3 h-3 text-[#8d94ff]" />
            <span>Campus Tech Council — Lead Coordinator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
