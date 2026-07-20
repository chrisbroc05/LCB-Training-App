import {
  settingsCardClass,
  settingsSectionDescriptionClass,
  settingsSectionTitleClass,
} from "@/app/settings/settings-styles";

type SettingsCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <section className={settingsCardClass}>
      <h2 className={settingsSectionTitleClass}>{title}</h2>
      {description ? <p className={settingsSectionDescriptionClass}>{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
