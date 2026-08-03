import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  getEditorTreeFromDb,
  saveEditorTreeToDb,
} from "@/lib/editorPersistence";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId } from "@/lib/editorWebs";
import { serverDebug, serverError } from "@/lib/server-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_TREE_SIZE_BYTES = 2 * 1024 * 1024;

function isPublicEditorId(id: string): boolean {
  return id === "default-page" || isEditorWebId(id);
}

async function getAuthenticatedUser() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    role: (session.user.role ?? "CLIENT") as UserRole,
  };
}

function jsonError(
  error: string,
  status: number,
  code?: string,
) {
  return NextResponse.json(
    {
      error,
      ...(code ? { code } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const page = new URL(request.url).searchParams.get("page") ?? "home";

  if (!id) {
    return jsonError("ID de editor requerido", 400, "EDITOR_ID_REQUIRED");
  }

  try {
    /*
     * Los IDs especiales pueden leerse sin comprobar propiedad,
     * únicamente si esa es una característica intencional del producto.
     */
    if (!isPublicEditorId(id)) {
      const user = await getAuthenticatedUser();

      if (!user) {
        return jsonError(
          "Autenticación requerida",
          401,
          "UNAUTHENTICATED",
        );
      }

      const allowed = await canManageSite(id, user.id, user.role);

      if (!allowed) {
        return jsonError(
          "No tienes permiso para acceder a este sitio",
          403,
          "FORBIDDEN",
        );
      }
    }

    const tree = await getEditorTreeFromDb(id, page);

    if (!tree) {
      serverDebug(
        `[API Editor GET] No tree found in DB for ID: ${id}, page: ${page}`,
      );
    }

    return NextResponse.json(
      { tree },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    serverError(`Error fetching editor tree for ID ${id}`, error);

    return jsonError(
      "No se pudo obtener el contenido del editor",
      500,
      "EDITOR_FETCH_FAILED",
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const page = new URL(request.url).searchParams.get("page") ?? "home";

  if (!id) {
    return jsonError("ID de editor requerido", 400, "EDITOR_ID_REQUIRED");
  }

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return jsonError(
        "Autenticación requerida",
        401,
        "UNAUTHENTICATED",
      );
    }

    /*
     * Toda escritura debe comprobar propiedad.
     *
     * No se permite escribir automáticamente por ser default-page
     * ni por cumplir isEditorWebId().
     */
    const allowed = await canManageSite(id, user.id, user.role);

    if (!allowed) {
      return jsonError(
        "No tienes permiso para modificar este sitio",
        403,
        "FORBIDDEN",
      );
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : 0;

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_TREE_SIZE_BYTES
    ) {
      return jsonError(
        "El contenido del editor excede el tamaño permitido",
        413,
        "PAYLOAD_TOO_LARGE",
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !Object.prototype.hasOwnProperty.call(body, "tree")
    ) {
      return jsonError(
        "El campo tree es obligatorio",
        400,
        "TREE_REQUIRED",
      );
    }

    const { tree } = body as { tree: unknown };

    if (tree === undefined || tree === null) {
      return jsonError(
        "El campo tree no puede estar vacío",
        400,
        "INVALID_TREE",
      );
    }

    const serializedTree = JSON.stringify(tree);
    const treeSize = Buffer.byteLength(serializedTree, "utf8");

    if (treeSize > MAX_TREE_SIZE_BYTES) {
      return jsonError(
        "El contenido del editor excede el tamaño permitido",
        413,
        "PAYLOAD_TOO_LARGE",
      );
    }

    const savedTree = await saveEditorTreeToDb(id, tree, page);

    return NextResponse.json(
      {
        ok: true,
        tree: savedTree,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    serverError(`Error saving editor tree for ID ${id}`, error);

    if (error instanceof SyntaxError) {
      return jsonError(
        "El cuerpo de la solicitud no contiene JSON válido",
        400,
        "INVALID_JSON",
      );
    }

    return jsonError(
      "No se pudo guardar el editor",
      500,
      "EDITOR_SAVE_FAILED",
    );
  }
}
