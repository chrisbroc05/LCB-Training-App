import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { applyAdminProductAccess } from "@/lib/admin-product-access-server";
import {
  ADMIN_GRANT_PRODUCTS,
  isAdminGrantProduct,
  type AdminGrantProduct,
} from "@/lib/admin-product-access-shared";
import {
  adminMemberDetailSelect,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProductAccessBody = {
  action?: string;
  product?: string;
  stripePaidOn?: string;
  skipEmail?: boolean;
  playbookLegacyAccess?: boolean;
};

function parseAction(value: string | undefined): "grant" | "remove" | null {
  if (value === "grant" || value === "remove") {
    return value;
  }
  return null;
}

function parseProduct(value: string | undefined): AdminGrantProduct | null {
  if (!value || !isAdminGrantProduct(value)) {
    return null;
  }
  return value;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: ProductAccessBody;
  try {
    body = (await request.json()) as ProductAccessBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = parseAction(body.action);
  const product = parseProduct(body.product);

  if (!action) {
    return NextResponse.json({ error: "action must be grant or remove." }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json(
      {
        error: `product must be one of: ${ADMIN_GRANT_PRODUCTS.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const result = await applyAdminProductAccess({
    userId: id,
    product,
    action,
    adminEmail: adminEmail!,
    stripePaidOn: body.stripePaidOn,
    skipEmail: body.skipEmail,
    playbookLegacyAccess: body.playbookLegacyAccess,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const member = await prisma.user.findUnique({
    where: { id },
    select: adminMemberDetailSelect,
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    member: serializeAdminMemberDetail(member),
  });
}
