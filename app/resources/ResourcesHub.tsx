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
  getResourceDefinition,
  getResourcesForHub,
  type ResourceDefinition,
} from "@/lib/resources-shared";

type ResourcesHubProps = {
  isLoggedIn: boolean;
};

export default function ResourcesHub({ isLoggedIn }: ResourcesHubProps) {
  const [leadResource, setLeadResource] = useState<ResourceDefinition | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const cards = getResourcesForHub();
  const workoutStartersIndex = cards.findIndex(
    (resource) => resource.section === "WORKOUT_STARTERS",
  );
  const bookCallResource = getResourceDefinition("book-a-call");

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
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((resource, index) => (
          <div
            key={resource.slug}
            id={index === workoutStartersIndex ? "workout-starters" : undefined}
            className={`scroll-mt-24 ${busySlug === resource.slug ? "opacity-70" : ""}`}
          >
            <ResourceCard resource={resource} onAction={handleAction} />
          </div>
        ))}
      </div>

      {bookCallResource ? (
        <div className="mt-10 rounded-2xl border border-[#1e2d45] bg-[#0A1628] p-6 text-center shadow-lg shadow-black/20 sm:p-8">
          <p className="text-lg font-semibold text-white sm:text-xl">
            Not sure where to start? Book a call with Coach Broc
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            A short conversation to figure out what fits your player.
          </p>
          <button
            type="button"
            onClick={() => void handleAction(bookCallResource)}
            disabled={busySlug === bookCallResource.slug}
            className="mt-5 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-[#2D6A4F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#52B788] hover:text-[#0A1628] disabled:opacity-70 sm:w-auto"
          >
            {bookCallResource.buttonLabel}
          </button>
        </div>
      ) : null}

      {leadResource ? (
        <ResourceLeadModal resource={leadResource} onClose={() => setLeadResource(null)} />
      ) : null}
    </>
  );
}
