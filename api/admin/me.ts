import { type ApiRequest, type ApiResponse, requireAdmin, sendError, setNoStore } from "../_utils/admin";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setNoStore(res);

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const { user } = await requireAdmin(req);
    res.status(200).json({
      email: user.email ?? null,
      isAdmin: true,
      userId: user.id
    });
  } catch (error) {
    sendError(res, error);
  }
}
