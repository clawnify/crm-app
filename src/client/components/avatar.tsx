import { avatarColor, getInitials } from "../utils";

export function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const name = `${firstName} ${lastName}`;
  return (
    <span class="avatar" style={{ background: avatarColor(name) }}>
      {getInitials(firstName, lastName)}
    </span>
  );
}
