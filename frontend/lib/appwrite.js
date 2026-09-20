// Appwrite avatar storage — stub until env vars are provided.
// User said: "i'll add the env variables later."
// Expected envs (when ready):
//   NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID,
//   NEXT_PUBLIC_APPWRITE_BUCKET_ID (for avatars)
// Until then, uploadAvatar just returns null and the onboarding
// will store no avatar or keep the preview locally.

export const isAppwriteConfigured = Boolean(
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
);

/**
 * Upload avatar file to Appwrite Storage and return a public URL.
 * For now this is a stub — if not configured, returns null so the
 * caller can skip avatar and just send profile data without it.
 * When you add env vars, replace the body with real Appwrite SDK:
 *   import { Client, Storage, ID } from "appwrite"
 */
export async function uploadAvatar(file) {
  if (!isAppwriteConfigured) return null;
  if (!(file instanceof File)) return null;

  // TODO: Appwrite real upload — example:
  // const client = new Client()
  //   .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  //   .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  // const storage = new Storage(client);
  // const res = await storage.createFile(
  //   process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
  //   ID.unique(),
  //   file
  // );
  // return storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID, res.$id).toString();

  // Stub: return a local object URL as placeholder so UI keeps working
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}
