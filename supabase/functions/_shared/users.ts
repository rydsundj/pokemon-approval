// Resolves the two users from Supabase secrets and maps a name to an
// e-mail address. Keeping the e-mail addresses here (as Edge Function
// secrets) instead of in the public frontend bundle avoids leaking them.

export interface AppUser {
  name: string;
  email: string;
}

export function getUsers(): AppUser[] {
  const users: AppUser[] = [];
  const n1 = Deno.env.get('USER_NAME_1');
  const e1 = Deno.env.get('USER_EMAIL_1');
  const n2 = Deno.env.get('USER_NAME_2');
  const e2 = Deno.env.get('USER_EMAIL_2');
  if (n1 && e1) users.push({ name: n1, email: e1 });
  if (n2 && e2) users.push({ name: n2, email: e2 });
  return users;
}

// The person who should be notified when `submittedBy` adds a card.
export function otherUser(submittedBy: string): AppUser | null {
  const users = getUsers();
  return users.find((u) => u.name !== submittedBy) ?? null;
}

// The person who submitted the card (to notify about a decision).
export function userByName(name: string): AppUser | null {
  return getUsers().find((u) => u.name === name) ?? null;
}
