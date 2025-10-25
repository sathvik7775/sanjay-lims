import React, { useState, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const AdminLogin = () => {
  const { navigate, successToast, setAdminToken } = useContext(LabContext);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle login submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      successToast("Please fill in all fields", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminlogin/login`,
        formData
      );

      if (res.data.success) {
        const token = res.data.token;

        // ✅ Save token in Context and localStorage
        setAdminToken(token);
        localStorage.setItem("adminToken", token);

        successToast("Login successful!", "success");
        navigate("/admin/dashboard");
      } else {
        successToast(res.data.message || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      successToast(
        error.response?.data?.message || "Server error, please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center bg-white/60 backdrop-blur-sm bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-2.jpg')" }}
    >
      {loading ? (
        <Loader />
      ) : (
        <form
          onSubmit={handleLogin}
          className="bg-white text-gray-500 max-w-[340px] w-full mx-4 md:p-6 p-4 py-8 text-left text-sm rounded-xl shadow-[0px_0px_10px_0px] shadow-black/10"
        >
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-2">
              Please log in to continue to <b>Admin</b>
            </p>
          </div>

          {/* Email */}
          <div className="flex items-center my-2 border bg-indigo-500/5 border-gray-500/10 rounded gap-1 pl-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m2.5 4.375 3.875 2.906c.667.5 1.583.5 2.25 0L12.5 4.375"
                stroke="#6B7280"
                strokeOpacity=".6"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.875 3.125h-8.75c-.69 0-1.25.56-1.25 1.25v6.25c0 .69.56 1.25 1.25 1.25h8.75c.69 0 1.25-.56 1.25-1.25v-6.25c0-.69-.56-1.25-1.25-1.25Z"
                stroke="#6B7280"
                strokeOpacity=".6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full outline-none bg-transparent py-2.5"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center mt-2 mb-4 border bg-indigo-500/5 border-gray-500/10 rounded gap-1 pl-2">
            <svg
              width="13"
              height="17"
              viewBox="0 0 13 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                fill="#6B7280"
              />
            </svg>
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full outline-none bg-transparent py-2.5"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mb-3 bg-primary hover:bg-primary/85 cursor-pointer transition py-2.5 rounded text-white font-medium"
          >
            Log In
          </button>
        </form>
      )}
    </div>
  );
};

export default AdminLogin;
