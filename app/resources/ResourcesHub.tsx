"use client";

import { useState } from "react";
import ResourceCard from "@/app/resources/ResourceCard";
import ResourceLeadModal from "@/app/resources/ResourceLeadModal";
import {
  followResourceLeadAction,
  postResourceLeadAction,
  readLeadIdFromCookie,
} from "@/lib/resources-lead-client";
import {
  getResourcesBySection,
  RESOURCE_SECTION_LABELS,
  type ResourceDefinition,
  type ResourceSection,
} from "@/lib/resources-shared";

const SECTION_ORDER: ResourceSection[] = [
  "START_HERE",
  "COACHING",
  "WORKOUT_STARTERS",
  "PROGRAMS_AND_GUIDES",
];

type ResourcesHubProps = {
  isLoggedIn: boolean;
};

export default function ResourcesHub({ isLoggedIn }: ResourcesHubProps) {
  const [leadResource, setLeadResource] = useState<ResourceDefinition | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const runLeadAction = async (resource: ResourceDefinition, leadId?: string) => {
    setBusySlug(resource.slug);
    try {
      const result = await postResourceLeadAction({
        resourceSlug: resource.slug,
        ...(leadId ? { leadId } : {}),
      });
      followResourceLeadAction(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusySlug(null);
    }
  };

  const handleAction = async (resource: ResourceDefinition) => {
    if (isLoggedIn) {
      await runLeadAction(resource);
      return;
    }

    const leadId = readLeadIdFromCookie();
    if (leadId) {
      await runLeadAction(resource, leadId);
      return;
    }

    setLeadResource(resource);
  };

  return (
    <>
      {SECTION_ORDER.map((section) => {
        const cards = getResourcesBySection(section);
        if (!cards.length) {
          return null;
        }
        return (
          <section key={section} className="mt-10 first:mt-0">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#52B788]">
              {RESOURCE_SECTION_LABELS[section]}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {cards.map((resource) => (
                <div key={resource.slug} className={busySlug === resource.slug ? "opacity-70" : ""}>
                  <ResourceCard resource={resource} onAction={handleAction} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {leadResource ? (
        <ResourceLeadModal resource={leadResource} onClose={() => setLeadResource(null)} />
      ) : null}
    </>
  );
}
