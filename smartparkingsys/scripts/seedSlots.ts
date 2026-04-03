import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function seedSlots() {
  const [{ connectDB }, { default: ParkingSlot }] = await Promise.all([
    import("../lib/db"),
    import("../models/ParkingSlot"),
  ]);

  await connectDB();

  await ParkingSlot.deleteMany({});

  const slots = Array.from({ length: 25 }, (_, index) => {
    const slotNumber = index + 1;

    return {
      slotNumber,
      row: Math.ceil(slotNumber / 5),
      col: (slotNumber - 1) % 5 + 1,
      isOccupied: false,
    };
  });

  await ParkingSlot.insertMany(slots);

  console.log("Inserted 25 parking slots successfully.");
}

seedSlots()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed parking slots.", error);
    process.exit(1);
  });
