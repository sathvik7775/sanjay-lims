import Doctor from "../models/Doctor.js";

/**
 * @desc Add a new referral doctor
 * @route POST /api/doctor/add
 */
export const addDoctor = async (req, res) => {
  try {
    const { name, phone, email, specialization, address, branchId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Doctor name and branchId are required",
      });
    }

    const doctor = new Doctor({
      name,
      phone,
      email,
      specialization,
      address,
      branchId,
    });

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (err) {
    console.error("Error adding doctor:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding doctor",
    });
  }
};

/**
 * @desc Delete a doctor by ID
 * @route DELETE /api/doctor/delete/:id
 */
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting doctor:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting doctor",
    });
  }
};

/**
 * @desc Get all doctors (Admin View)
 * @route GET /api/doctor/all
 */
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching doctors",
    });
  }
};

/**
 * @desc Get single doctor by ID
 * @route GET /api/doctor/:id
 */
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    console.error("Error fetching doctor by ID:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching doctor",
    });
  }
};
