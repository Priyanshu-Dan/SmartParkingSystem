import { model, models, Schema, type InferSchemaType } from "mongoose";

const parkingSlotSchema = new Schema(
  {
    slotNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    row: {
      type: Number,
      required: true,
    },
    col: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ParkingSlotDocument = InferSchemaType<typeof parkingSlotSchema> & {
  _id: string;
};

const ParkingSlot = models.ParkingSlot || model("ParkingSlot", parkingSlotSchema);

export default ParkingSlot;
