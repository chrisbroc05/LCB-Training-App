import "server-only";

import {
  DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE,
  type FreeSwingAnalysisResponseMode,
  parseFreeSwingAnalysisResponseMode,
} from "@/lib/free-swing-analysis-response-shared";
import { prisma } from "@/lib/prisma";

const SETTINGS_ROW_ID = 1;

export async function ensureAppAdminSettingsRow() {
  await prisma.appAdminSettings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: {
      id: SETTINGS_ROW_ID,
      freeSwingAnalysisResponseMode: DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE,
    },
    update: {},
  });
}

export async function getFreeSwingAnalysisResponseMode(): Promise<FreeSwingAnalysisResponseMode> {
  const row = await prisma.appAdminSettings.findUnique({
    where: { id: SETTINGS_ROW_ID },
    select: { freeSwingAnalysisResponseMode: true },
  });
  if (!row) {
    return DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE;
  }
  return row.freeSwingAnalysisResponseMode;
}

export async function setFreeSwingAnalysisResponseMode(mode: FreeSwingAnalysisResponseMode) {
  await prisma.appAdminSettings.upsert({
    where: { id: SETTINGS_ROW_ID },
    create: {
      id: SETTINGS_ROW_ID,
      freeSwingAnalysisResponseMode: mode,
    },
    update: {
      freeSwingAnalysisResponseMode: mode,
    },
  });
}

export function parseFreeSwingAnalysisResponseModeRequest(value: unknown) {
  return parseFreeSwingAnalysisResponseMode(value);
}
