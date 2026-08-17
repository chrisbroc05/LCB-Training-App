import {
  profileCardClass,
  profileSectionDescriptionClass,
  profileSectionTitleClass,
} from "@/app/profile/profile-styles";

type ProfileCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function ProfileCard({ title, description, children }: ProfileCardProps) {
  return (
    <section className={profileCardClass}>
      <h2 className={profileSectionTitleClass}>{title}</h2>
      {description ? <p className={profileSectionDescriptionClass}>{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
