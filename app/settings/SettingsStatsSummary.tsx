import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsStatBadgeClass,
  settingsStatCardClass,
  settingsStatLabelClass,
  settingsStatSubValueClass,
  settingsStatValueClass,
} from "@/app/settings/settings-styles";

type SettingsStatItem = {
  label: string;
  value: string;
  subValue?: string;
  variant?: "default" | "badge";
};

type SettingsStatsSummaryProps = {
  stats: SettingsStatItem[];
};

export default function SettingsStatsSummary({ stats }: SettingsStatsSummaryProps) {
  return (
    <SettingsCard title="Account Summary">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className={settingsStatCardClass}>
            <p className={settingsStatLabelClass}>{stat.label}</p>
            {stat.variant === "badge" ? (
              <span className={settingsStatBadgeClass}>{stat.value}</span>
            ) : (
              <>
                <p className={settingsStatValueClass}>{stat.value}</p>
                {stat.subValue ? <p className={settingsStatSubValueClass}>{stat.subValue}</p> : null}
              </>
            )}
          </article>
        ))}
      </div>
    </SettingsCard>
  );
}
