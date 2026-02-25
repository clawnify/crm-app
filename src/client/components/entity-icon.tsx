import { useState } from "preact/hooks";
import { avatarColor } from "../utils";

export function EntityIcon({ name, domain }: { name: string; domain?: string }) {
  const [imgError, setImgError] = useState(false);
  const letter = (name?.[0] || "?").toUpperCase();

  if (domain && !imgError) {
    return (
      <span class="entity-icon" style={{ background: "#f1f5f9" }}>
        <img
          src={`https://favicone.com/${domain}?s=32`}
          alt=""
          width={16}
          height={16}
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span class="entity-icon" style={{ background: avatarColor(name) }}>
      {letter}
    </span>
  );
}
