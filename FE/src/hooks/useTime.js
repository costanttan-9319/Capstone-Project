import { useState, useEffect } from "react";

const useTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const options = { timeZone: "Asia/Singapore", hour12: false };

  const currentDay = new Intl.DateTimeFormat("en-US", {
    ...options,
    weekday: "long",
  }).format(currentTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(currentTime);
  const currentHour = parseInt(parts.find((p) => p.type === "hour").value);
  const currentMinute = parseInt(parts.find((p) => p.type === "minute").value);

  // ========== CHECK IF 24 HOURS ==========
  const is24Hours = (timeRange) => {
    if (!timeRange) return false;
    const lower = String(timeRange).toLowerCase();
    return lower.includes("24") && (lower.includes("hour") || lower.includes("hr"));
  };

  const getStoreStatus = (openingHours) => {
    if (!openingHours) return "Closed";
    
    // Parse if it comes in as a JSON string from the database
    const hoursObj = typeof openingHours === "string" ? JSON.parse(openingHours) : openingHours;
    const todayHours = hoursObj[currentDay];
    
    if (!todayHours) return "Closed";

    // ========== NEW LOGIC: HANDLE OBJECT PACKAGE ==========
    if (typeof todayHours === "object") {
      if (todayHours.isClosed) return "Closed";
      if (todayHours.is24Hours) return "Open";
      
      const openStr = todayHours.open;
      const closeStr = todayHours.close;
      if (!openStr || !closeStr) return "Closed";

      const toMinutes = (timeStr) => {
        if (!timeStr) return null;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return null;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const isPM = match[3].toUpperCase() === "PM";
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const open = toMinutes(openStr);
      const close = toMinutes(closeStr);
      const now = currentHour * 60 + currentMinute;

      if (open === null || close === null) return "Closed";
      
      // Handle overnight logic (e.g., 6 PM to 3 AM)
      if (close < open) {
        return (now >= open || now < close) ? "Open" : "Closed";
      }
      return (now >= open && now < close) ? "Open" : "Closed";
    }

    // ========== OLD LOGIC: HANDLE STRING FORMAT ==========
    if (todayHours === "Closed") return "Closed";
    if (is24Hours(todayHours)) return "Open";
    if (typeof todayHours === "string" && !todayHours.includes(" - ")) return "Closed";
    
    const [openTime, closeTime] = todayHours.split(" - ");
    if (!openTime || !closeTime) return "Closed";
    
    const toMinutes = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const isPM = match[3].toUpperCase() === "PM";
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    
    const open = toMinutes(openTime);
    const close = toMinutes(closeTime);
    if (open === null || close === null) return "Closed";
    
    const now = currentHour * 60 + currentMinute;
    
    // String handle overnight logic
    if (close < open) {
      return (now >= open || now < close) ? "Open" : "Closed";
    }
    return (now >= open && now < close) ? "Open" : "Closed";
  };

  return { currentDay, currentHour, currentMinute, getStoreStatus };
};

export default useTime;