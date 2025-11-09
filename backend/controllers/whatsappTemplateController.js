import WhatsappTemplate from "../models/WhatsappTemplate.js";


// 🔹 Add new template
export const addTemplate = async (req, res) => {
  try {
    const { title, triggerType, message, delayMinutes } = req.body;
  

    const newTemplate = new WhatsappTemplate({
      title,
      triggerType,
      message,
      delayMinutes,
      
    });

    await newTemplate.save();
    res.status(201).json({ success: true, message: "Template added", data: newTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add template" });
  }
};

// 🔹 Get all templates for a branch
export const getTemplates = async (req, res) => {
  try {
    // 🧩 Fetch all WhatsApp templates (no branch filter)
    const templates = await WhatsappTemplate.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error("❌ Error fetching WhatsApp templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

// 🔹 Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await WhatsappTemplate.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({ success: true, message: "Template updated", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update template" });
  }
};

// 🔹 Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await WhatsappTemplate.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Template deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete template" });
  }
};

// 🔹 Send WhatsApp Message (using WhatsApp Cloud API or Twilio)
// export const sendWhatsappMessage = async (phoneNumber, messageText) => {
//   try {
//     // Example for WhatsApp Cloud API
//     const token = process.env.WHATSAPP_TOKEN;
//     const phoneId = process.env.WHATSAPP_PHONE_ID;

//     await axios.post(
//       `https://graph.facebook.com/v18.0/${phoneId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to: phoneNumber,
//         text: { body: messageText },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ WhatsApp message sent to", phoneNumber);
//   } catch (error) {
//     console.error("❌ Failed to send WhatsApp message:", error.response?.data || error.message);
//   }
// };
