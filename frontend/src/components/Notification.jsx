import React, { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";

import { LabContext } from "../context/LabContext";

const socket = io(import.meta.env.VITE_API_URL); // Backend URL

const Notification = () => {
  const { isOpen, setIsOpen } = useContext(LabContext); // Context state for popup
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.on("new_case", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => socket.off("new_case");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white w-96 max-h-[70vh] overflow-y-auto rounded-lg shadow-lg p-4 relative">
        <h3 className="text-lg font-semibold mb-3">Notifications</h3>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No notifications</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((note, idx) => (
              <div
                key={idx}
                className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 shadow-sm rounded"
              >
                <p className="font-bold">{note.patientName}</p>
                <p className="text-sm">{note.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
