import React, { useState, useEffect, useRef } from "react";
import {
  HardDrive,
  Download,
  RefreshCcw,
  CheckCircle,
  Loader2,
  Clock,
  CalendarClock,
} from "lucide-react";

const Backup = () => {
  const initialDrives = JSON.parse(localStorage.getItem("drives")) || [
    { id: "A", name: "Drive A", capacity: "1 TB", used: "450 GB", status: "Available", lastBackup: "2025-10-01 09:30 AM" },
    { id: "B", name: "Drive B", capacity: "1 TB", used: "980 GB", status: "Full", lastBackup: "2025-09-28 02:10 PM" },
    { id: "C", name: "Drive C", capacity: "2 TB", used: "1.2 TB", status: "Available", lastBackup: "2025-10-03 08:15 PM" },
  ];

  const [drives, setDrives] = useState(initialDrives);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [backupStatus, setBackupStatus] = useState({ inProgress: false, success: false });
  const [schedule, setSchedule] = useState(localStorage.getItem("backupSchedule") || "manual");
  const [nextBackup, setNextBackup] = useState(null);
  const intervalRef = useRef(null);

  // Save drives to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem("drives", JSON.stringify(drives));
  }, [drives]);

  // Update next backup date whenever schedule changes
  useEffect(() => {
    if (schedule === "manual") {
      setNextBackup(null);
    } else {
      const next = calculateNextBackup(schedule);
      setNextBackup(next.toLocaleString());
    }
    localStorage.setItem("backupSchedule", schedule);
  }, [schedule]);

  const calculateNextBackup = (type) => {
    const now = new Date();
    const next = new Date();
    if (type === "daily") next.setDate(now.getDate() + 1);
    if (type === "weekly") next.setDate(now.getDate() + 7);
    if (type === "monthly") next.setMonth(now.getMonth() + 1);
    next.setHours(2, 0, 0, 0); // 2 AM backups
    return next;
  };

  // Auto-backup simulation
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (schedule !== "manual" && selectedDrive) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        if (nextBackup && new Date(nextBackup) <= now) {
          handleBackup(true);
          const next = calculateNextBackup(schedule);
          setNextBackup(next.toLocaleString());
        }
      }, 60000); // check every minute
    }

    return () => clearInterval(intervalRef.current);
  }, [nextBackup, schedule, selectedDrive]);

  const handleBackup = (auto = false) => {
    if (!selectedDrive) {
      alert("Please select a drive to backup data.");
      return;
    }

    setBackupStatus({ inProgress: true, success: false });

    setTimeout(() => {
      setBackupStatus({ inProgress: false, success: true });
      setDrives((prev) =>
        prev.map((d) =>
          d.id === selectedDrive
            ? {
                ...d,
                lastBackup: new Date().toLocaleString(),
                used: "Updated",
                status: "Available",
              }
            : d
        )
      );
      if (!auto) alert("Manual backup completed successfully!");
    }, 2000);
  };

  const handleDownload = () => {
    if (!selectedDrive) {
      alert("Select a drive to download backup!");
      return;
    }
    const blob = new Blob([`Simulated backup data for ${selectedDrive}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${selectedDrive}_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <HardDrive className="w-6 h-6 text-blue-600" /> Backup Management
      </h2>

      {/* Drives Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Select</th>
              <th className="border p-2">Drive Name</th>
              <th className="border p-2">Capacity</th>
              <th className="border p-2">Used</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Last Backup</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((drive) => (
              <tr key={drive.id} className={`hover:bg-gray-50 ${selectedDrive === drive.id ? "bg-blue-50" : ""}`}>
                <td className="border p-2 text-center">
                  <input
                    type="radio"
                    name="drive"
                    value={drive.id}
                    checked={selectedDrive === drive.id}
                    onChange={() => setSelectedDrive(drive.id)}
                    disabled={drive.status === "Full"}
                  />
                </td>
                <td className="border p-2 font-medium">{drive.name}</td>
                <td className="border p-2">{drive.capacity}</td>
                <td className="border p-2">{drive.used}</td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      drive.status === "Full" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {drive.status}
                  </span>
                </td>
                <td className="border p-2 text-gray-600">{drive.lastBackup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Backup Settings */}
      <div className="border rounded-lg p-4 bg-gray-50 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" /> Automated Backup Schedule
        </h3>

        <div className="flex flex-wrap gap-4 items-center">
          {["manual", "daily", "weekly", "monthly"].map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="radio"
                name="schedule"
                value={type}
                checked={schedule === type}
                onChange={(e) => setSchedule(e.target.value)}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)} {type !== "manual" ? "(2 AM)" : "Only"}
            </label>
          ))}
        </div>

        {nextBackup && (
          <div className="mt-3 text-sm text-gray-700 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-green-600" />
            Next scheduled backup: <strong>{nextBackup}</strong>
          </div>
        )}
      </div>

      {/* Manual Backup Controls */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-3">
          <button
            onClick={() => handleBackup(false)}
            disabled={backupStatus.inProgress}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {backupStatus.inProgress ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Backing Up...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" /> Start Backup
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" /> Download Backup
          </button>
        </div>

        {backupStatus.success && (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle className="w-5 h-5 mr-1" /> Backup completed successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default Backup;
