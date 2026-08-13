// Reads all frontend configuration from Vite env variables.
// Only VITE_-prefixed vars are available in the browser (by design).
// The Resend key and the user e-mail addresses live server-side as
// Supabase secrets and are NOT exposed here.

const env = import.meta.env;

export const config = {
  supabaseUrl: env.VITE_SUPABASE_URL,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  sharedPassword: env.VITE_SHARED_PASSWORD ?? '',
  users: [
    env.VITE_USER_NAME_1 || 'Anna',
    env.VITE_USER_NAME_2 || 'Erik',
  ],
};

// Warn loudly in the console if the two required Supabase vars are missing,
// so setup mistakes are easy to spot.
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Saknar VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY. ' +
      'Fyll i .env (lokalt) eller repo-hemligheterna (GitHub Actions).',
  );
}
