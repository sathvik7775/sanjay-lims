import Agent from "../models/Agent.js";

/**
 * @desc Add a new agent
 * @route POST /api/agent/add
 */
export const addAgent = async (req, res) => {
  try {
    const { name, phone, email, address, branchId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Agent name and branchId are required",
      });
    }

    const agent = new Agent({
      name,
      phone,
      email,
      address,
      branchId,
    });

    await agent.save();

    return res.status(201).json({
      success: true,
      message: "Agent added successfully",
      data: agent,
    });
  } catch (err) {
    console.error("Error adding agent:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding agent",
    });
  }
};

/**
 * @desc Delete an agent by ID
 * @route DELETE /api/agent/delete/:id
 */
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findByIdAndDelete(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting agent:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting agent",
    });
  }
};

/**
 * @desc Archive or activate an agent (change status)
 * @route PATCH /api/agent/status/:id
 */
export const updateAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Archived'",
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agent status updated to ${status}`,
      data: agent,
    });
  } catch (err) {
    console.error("Error updating agent status:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating agent status",
    });
  }
};

/**
 * @desc Get all agents (Admin view)
 * @route GET /api/agent/all
 */
export const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (err) {
    console.error("Error fetching agents:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching agents",
    });
  }
};

/**
 * @desc Get a single agent by ID
 * @route GET /api/agent/:id
 */
export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (err) {
    console.error("Error fetching agent by ID:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching agent",
    });
  }
};
