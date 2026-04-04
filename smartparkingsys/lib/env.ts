export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Please define the ${name} environment variable in .env.local`);
  }

  return value;
}
