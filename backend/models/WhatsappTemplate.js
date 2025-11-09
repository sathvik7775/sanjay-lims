import mongoose from "mongoose";

const whatsappTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    }, // e.g. "Welcome Message" or "Report Ready Message"

    triggerType: {
      type: String,
      required: true,
      enum: [
        "welcome",
        "bill",
        "report",
        "sample_received",
        "payment_confirmation",
        "appointment_reminder",
        "custom",
      ],
    }, // identifies when this message is sent

    message: {
      type: String,
      required: true,
    }, // the message content (with placeholders like {{patientName}}, {{billAmount}})

    isActive: {
      type: Boolean,
      default: true,
    }, // allow toggle ON/OFF

    delayMinutes: {
      type: Number,
      default: 0,
    }, // delay in minutes before sending (e.g. bill message after 5 mins)

    

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WhatsappTemplate", whatsappTemplateSchema);
