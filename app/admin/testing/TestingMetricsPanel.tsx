"use client";

import { useEffect, useState } from "react";
import type { TestBetterIs, TestMetricRecord, TestStationRecord } from "@/lib/testing-shared";

export default function TestingMetricsPanel() {
  const [metrics, setMetrics] = useState<TestMetricRecord[]>([]);
  const [stations, setStations] = useState<TestStationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stationForm, setStationForm] = useState({
    key: "",
    label: "",
    sortOrder: "50",
    active: true,
    metricKeys: [] as string[],
  });
  const [form, setForm] = useState({
    key: "",
    label: "",
    unit: "",
    decimals: "2",
    betterIs: "LOWER" as TestBetterIs,
    category: "",
    sortOrder: "150",
    inputType: "number",
    active: true,
  });

  async function loadAll() {
    const [metricsResponse, stationsResponse] = await Promise.all([
      fetch("/api/admin/testing/metrics", { cache: "no-store" }),
      fetch("/api/admin/testing/stations", { cache: "no-store" }),
    ]);
    const metricsData = (await metricsResponse.json()) as { metrics?: TestMetricRecord[]; error?: string };
    const stationsData = (await stationsResponse.json()) as { stations?: TestStationRecord[]; error?: string };
    if (!metricsResponse.ok) {
      setError(metricsData.error ?? "Failed to load metrics.");
      return;
    }
    setMetrics(metricsData.metrics ?? []);
    setStations(stationsData.stations ?? []);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function saveMetric(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/testing/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: form.key,
        label: form.label,
        unit: form.unit,
        decimals: Number(form.decimals),
        betterIs: form.betterIs,
        category: form.category,
        sortOrder: Number(form.sortOrder),
        inputType: form.inputType,
        active: form.active,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Failed to save metric.");
      return;
    }
    setForm({
      key: "",
      label: "",
      unit: "",
      decimals: "2",
      betterIs: "LOWER",
      category: "",
      sortOrder: "150",
      inputType: "number",
      active: true,
    });
    await loadAll();
  }

  async function saveStation(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/testing/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: stationForm.key,
        label: stationForm.label,
        sortOrder: Number(stationForm.sortOrder),
        active: stationForm.active,
        metricKeys: stationForm.metricKeys,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Failed to save station.");
      return;
    }
    setStationForm({ key: "", label: "", sortOrder: "50", active: true, metricKeys: [] });
    await loadAll();
  }

  function editStation(station: TestStationRecord) {
    setStationForm({
      key: station.key,
      label: station.label,
      sortOrder: String(station.sortOrder),
      active: station.active,
      metricKeys: station.metricKeys,
    });
  }

  function toggleStationMetric(metricKey: string) {
    setStationForm((current) => ({
      ...current,
      metricKeys: current.metricKeys.includes(metricKey)
        ? current.metricKeys.filter((key) => key !== metricKey)
        : [...current.metricKeys, metricKey],
    }));
  }

  function editMetric(metric: TestMetricRecord) {
    setForm({
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      decimals: String(metric.decimals),
      betterIs: metric.betterIs,
      category: metric.category,
      sortOrder: String(metric.sortOrder),
      inputType: metric.inputType,
      active: metric.active,
    });
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Add or edit metric</h2>
        <form onSubmit={(event) => void saveMetric(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={form.key}
            onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
            placeholder="key (snake_case)"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            required
          />
          <input
            value={form.label}
            onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
            placeholder="Label"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            required
          />
          <input
            value={form.unit}
            onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
            placeholder="Unit"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            required
          />
          <input
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            placeholder="Category"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            required
          />
          <select
            value={form.betterIs}
            onChange={(event) =>
              setForm((current) => ({ ...current, betterIs: event.target.value as TestBetterIs }))
            }
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          >
            <option value="LOWER">Lower is better</option>
            <option value="HIGHER">Higher is better</option>
          </select>
          <select
            value={form.inputType}
            onChange={(event) =>
              setForm((current) => ({ ...current, inputType: event.target.value }))
            }
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          >
            <option value="number">Number</option>
            <option value="feet_inches">Feet and inches</option>
          </select>
          <input
            value={form.decimals}
            onChange={(event) =>
              setForm((current) => ({ ...current, decimals: event.target.value }))
            }
            placeholder="Decimals"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          />
          <input
            value={form.sortOrder}
            onChange={(event) =>
              setForm((current) => ({ ...current, sortOrder: event.target.value }))
            }
            placeholder="Sort order"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({ ...current, active: event.target.checked }))
              }
            />
            Active
          </label>
          <button
            type="submit"
            className="sm:col-span-2 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-[#0A1628]"
          >
            Save metric
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Add or edit station</h2>
        <form onSubmit={(event) => void saveStation(event)} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={stationForm.key}
              onChange={(event) =>
                setStationForm((current) => ({ ...current, key: event.target.value }))
              }
              placeholder="key (snake_case)"
              className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
              required
            />
            <input
              value={stationForm.label}
              onChange={(event) =>
                setStationForm((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="Label"
              className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
              required
            />
            <input
              value={stationForm.sortOrder}
              onChange={(event) =>
                setStationForm((current) => ({ ...current, sortOrder: event.target.value }))
              }
              placeholder="Sort order"
              className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
            />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={stationForm.active}
                onChange={(event) =>
                  setStationForm((current) => ({ ...current, active: event.target.checked }))
                }
              />
              Active
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <button
                key={metric.key}
                type="button"
                onClick={() => toggleStationMetric(metric.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stationForm.metricKeys.includes(metric.key)
                    ? "bg-[#22c55e] text-[#0A1628]"
                    : "border border-[#2b3650] text-zinc-400"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-[#0A1628]"
          >
            Save station
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {stations.map((station) => (
            <button
              key={station.key}
              type="button"
              onClick={() => editStation(station)}
              className="flex w-full flex-col rounded-xl border border-[#2b3650] px-4 py-3 text-left text-sm text-zinc-300"
            >
              <span className="font-semibold text-zinc-100">
                {station.label} ({station.key})
              </span>
              <span className="mt-1 text-xs text-zinc-500">{station.metricKeys.join(", ")}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Current metrics</h2>
        <div className="mt-4 space-y-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => editMetric(metric)}
              className="flex w-full items-center justify-between rounded-xl border border-[#2b3650] px-4 py-3 text-left text-sm text-zinc-300"
            >
              <span>
                {metric.label} ({metric.key})
              </span>
              <span>{metric.active ? "Active" : "Inactive"}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
