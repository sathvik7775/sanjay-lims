import React, { useEffect, useState } from "react";

const Loader = ({ text }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let interval;

    const start = () => {
      interval = setInterval(() => {
        setPercent(prev => {
          let next = prev + 3; // faster speed

          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }

          // ---- PAUSE LOGIC ----
          if (prev < 33 && next >= 33) {
            next = 33;
            clearInterval(interval);
            setTimeout(start, 1000); // pause at 33%
          }

          if (prev < 77 && next >= 77) {
            next = 77;
            clearInterval(interval);
            setTimeout(start, 2000); // pause at 77%
          }

          return next;
        });
      }, 60); // fast but smooth
    };

    start();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/40 ">
      <img src="/lab-loader.gif" className="w-20 h-20 mb-2" alt="loading" />

      {text && (
        <p className="text-gray-700 mt-2 text-sm font-medium">
          {text}... {percent}%
        </p>
      )}
    </div>
  );
};

export default Loader;
