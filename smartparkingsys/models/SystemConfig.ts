import { model, models, Schema, type InferSchemaType } from "mongoose";

const systemConfigSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "global",
      immutable: true,
      select: false,
    },
    pricePerHour: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

export type SystemConfigDocument = InferSchemaType<typeof systemConfigSchema> & {
  _id: string;
};

const SystemConfig =
  models.SystemConfig || model("SystemConfig", systemConfigSchema);

export default SystemConfig;
