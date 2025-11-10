import React, { useContext, useState } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const BranchLogin = () => {
  const { setBranchId, navigate, successToast, errorToast, branchData, setBranchData } = useContext(LabContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  



  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return errorToast("Please fill in all fields");

    try {
      setLoading(true);
      const res = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/branchlogin/login`,
  {
    loginEmail: email,
    loginPassword: password,
  }
);


      
      

      if (res.data.success) {
        // Save token + branch info
        localStorage.setItem("branchToken", res.data.token);
        localStorage.setItem("branchInfo", JSON.stringify(res.data.branch));

        setBranchId(res.data.branch._id);
        setBranchData(res.data.branch)
        successToast(res.data.message);
        navigate(`/${res.data.branch._id}/dashboard`);
      } else {
        errorToast(res.data.message);
      }
    } catch (err) {
      console.error("Branch login failed:", err);
      errorToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader/>;

  return (
    <div
      className="h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-2.jpg')" }}
    >
      <form
        onSubmit={handleLogin}
        className="bg-white text-gray-500 max-w-[340px] w-full mx-4 md:p-6 p-4 py-8 text-left text-sm rounded-xl shadow-[0px_0px_10px_0px] shadow-black/10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-2">
            Please login to continue to <b>Branch</b>
          </p>
        </div>

        {/* Email */}
        <div className="sm:flex items-center my-2 border bg-indigo-500/5 border-gray-500/10 rounded gap-1 pl-2">
          <input
            className="w-full outline-none bg-transparent py-2.5 px-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="sm:flex items-center mt-2 mb-4 border bg-indigo-500/5 border-gray-500/10 rounded gap-1 pl-2">
          <input
            className="w-full outline-none bg-transparent py-2.5 px-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="cursor-pointer accent-indigo-500" />
            Remember me
          </label>
          <a className="text-blue-600 hover:underline" href="#">
            Forgot Password?
          </a>
        </div>

        {/* Login button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full mb-3 bg-primary hover:bg-primary/85 transition py-2.5 rounded text-white font-medium ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default BranchLogin;

