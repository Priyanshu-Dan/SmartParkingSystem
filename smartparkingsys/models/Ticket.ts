import { model, models, Schema, type InferSchemaType } from "mongoose";

const ticketSchema = new Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },
    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      required: true,
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

export type TicketDocument = InferSchemaType<typeof ticketSchema> & {
  _id: string;
};

const Ticket = models.Ticket || model("Ticket", ticketSchema);

export default Ticket;
