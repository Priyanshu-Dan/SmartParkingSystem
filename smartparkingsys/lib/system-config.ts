import SystemConfig from "@/models/SystemConfig";

const GLOBAL_CONFIG_KEY = "global";
const DEFAULT_PRICE_PER_HOUR = 20;

export async function getSystemConfig() {
  return SystemConfig.findOneAndUpdate(
    { singletonKey: GLOBAL_CONFIG_KEY },
    {
      $setOnInsert: {
        singletonKey: GLOBAL_CONFIG_KEY,
        pricePerHour: DEFAULT_PRICE_PER_HOUR,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function updateSystemConfigPrice(pricePerHour: number) {
  return SystemConfig.findOneAndUpdate(
    { singletonKey: GLOBAL_CONFIG_KEY },
    {
      $set: { pricePerHour },
      $setOnInsert: { singletonKey: GLOBAL_CONFIG_KEY },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
}
