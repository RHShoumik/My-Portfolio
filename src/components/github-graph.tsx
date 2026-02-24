"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4
}

function generateContributions(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const rand = Math.random();
    let count = 0;
    let level = 0;
    if (rand > 0.3) {
      count = Math.floor(Math.random() * 12) + 1;
      level = count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4;
    }
    days.push({
      date: date.toISOString().split("T")[0],
      count,
      level,
    });
  }
  return days;
}

export function GitHubGraph({ username = "rhshoumik" }: { username?: string }) {
  const [data] = useState<ContributionDay[]>(generateContributions);

  // Group into weeks
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const levelColors = [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/60",
    "bg-primary/90",
  ];

  return (
    <div>
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Contribution Activity</h3>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-primary hover:underline"
          >
            @{username}
          </a>
        </div>

        {/* Graph */}
        <div className="overflow-x-auto">
          <div className="flex gap-0.75">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.75">
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`size-2.75 rounded-[2px] transition-colors ${levelColors[day.level]}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>
                        {day.count} contributions on{" "}
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {levelColors.map((c, i) => (
            <div key={i} className={`size-2.5 rounded-[2px] ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

