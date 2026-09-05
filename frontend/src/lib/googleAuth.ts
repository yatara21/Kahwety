export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

export interface GoogleButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
}

export interface GoogleIdentityServices {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  prompt: (notification?: (notification: unknown) => void) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityServices;
      };
    };
  }
}

let gsiPromise: Promise<GoogleIdentityServices> | null = null;

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function isGoogleAuthAvailable(): boolean {
  return Boolean(getGoogleClientId());
}

export function loadGoogleIdentityServices(): Promise<GoogleIdentityServices> {
  if (gsiPromise) {
    return gsiPromise;
  }

  if (typeof window === "undefined") {
    gsiPromise = Promise.reject(new Error("Google Identity Services is only available in the browser"));
    return gsiPromise;
  }

  if (window.google?.accounts?.id) {
    gsiPromise = Promise.resolve(window.google.accounts.id);
    return gsiPromise;
  }

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-gsi-client]");
    const start = Date.now();
    let rejected = false;

    const fail = (err: Error) => {
      if (!rejected) {
        rejected = true;
        reject(err);
      }
    };

    const poll = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }
      if (Date.now() - start > 15000) {
        fail(new Error("Google Identity Services failed to load within 15 seconds"));
        return;
      }
      setTimeout(poll, 100);
    };

    if (existing) {
      existing.addEventListener("error", () => fail(new Error("Failed to load Google Identity Services")));
      poll();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-gsi-client", "true");
    script.addEventListener("error", () => fail(new Error("Failed to load Google Identity Services")));
    document.head.appendChild(script);
    poll();
  });

  return gsiPromise;
}
