"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

/* Official Google sign-in button (Google Identity Services).
   Sends the ID token `credential` to the parent, which POSTs it to the
   backend for verification — the backend owns all trust decisions.
   The button width follows its container (GIS only takes fixed px widths),
   clamped to Google's 200–400px range.
   If NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing, renders the same-styled
   disabled button with a setup note instead of crashing. */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleSignInButton({ onSuccess, onError }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(Math.max(200, Math.min(400, Math.floor(el.clientWidth) || 320)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!CLIENT_ID) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" className="w-full bg-paper-white" disabled>
          <GoogleIcon />
          Continue with Google
        </Button>
        <p className="text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">
          Google sign-in needs a Client ID — set NEXT_PUBLIC_GOOGLE_CLIENT_ID first.
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div ref={wrapRef} className="flex w-full justify-center">
        <GoogleLogin
          text="continue_with"
          theme="outline"
          shape="rectangular"
          width={String(width)}
          onSuccess={onSuccess}
          onError={() => onError?.()}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
