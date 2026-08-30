import Constants from "expo-constants";

/**
 * Base URL for this app's own Expo Router API routes (src/app/api/*+api.ts).
 * A native client has no browser "current origin" to resolve a relative
 * fetch() against, so this has to be built explicitly.
 *
 * In dev, the API routes are served by the same Metro dev server the app
 * bundle just loaded from — Constants.expoConfig.hostUri gives that host:port.
 * A production build has no packager host, so EXPO_PUBLIC_API_BASE_URL must
 * be set to wherever the API routes are actually deployed.
 */
export function getApiBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri}`;

  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured) return configured;

  throw new Error(
    "Could not determine the API base URL — set EXPO_PUBLIC_API_BASE_URL for production builds.",
  );
}
