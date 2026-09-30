import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import {
  getInPersonTrainingInfo,
  saveInPersonTrainingInfo,
} from "@/lib/in-person-training-server";
import { validateInPersonTrainingInput } from "@/lib/in-person-training-shared";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const info = await getInPersonTrainingInfo(session.user.id);
  if (!info) {
    return jsonNoStore({ error: "User not found." }, { status: 404 });
  }

  return jsonNoStore({ info });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    trainsInPerson?: boolean;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalNotes?: string;
  } | null;

  if (typeof body?.trainsInPerson !== "boolean") {
    return jsonNoStore({ error: "Choose whether you train in person." }, { status: 400 });
  }

  const input = {
    trainsInPerson: body.trainsInPerson,
    emergencyContactName: body.emergencyContactName?.trim() ?? "",
    emergencyContactPhone: body.emergencyContactPhone?.trim() ?? "",
    medicalNotes: body.medicalNotes?.trim() ?? "",
  };

  const validationError = validateInPersonTrainingInput(input);
  if (validationError) {
    return jsonNoStore({ error: validationError }, { status: 400 });
  }

  const info = await saveInPersonTrainingInfo(session.user.id, input);
  return jsonNoStore({ info });
}
