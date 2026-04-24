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

  // Helper function for time conversion (Global inside the hook)
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

  // ========== NEW LOGIC: DETERMINE WHICH DAY TO DISPLAY ==========
  const getDisplayDay = (openingHours) => {
    if (!openingHours) return currentDay;
    const hoursObj = typeof openingHours === "string" ? JSON.parse(openingHours) : openingHours;
    const now = currentHour * 60 + currentMinute;
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIndex = daysOfWeek.indexOf(currentDay);
    const yesterdayDay = daysOfWeek[(todayIndex - 1 + 7) % 7]; 
    const yesterdayHours = hoursObj[yesterdayDay];

    if (yesterdayHours) {
      const yesterdayIs24 = is24Hours(yesterdayHours) || (typeof yesterdayHours === 'object' && yesterdayHours.is24Hours);
      if (yesterdayIs24 && now < 240) {
        return yesterdayDay;
      }

      let yOpen, yClose;
      if (typeof yesterdayHours === "object" && yesterdayHours.open && !yesterdayHours.isClosed) {
        yOpen = toMinutes(yesterdayHours.open);
        yClose = toMinutes(yesterdayHours.close);
      } else if (typeof yesterdayHours === "string" && yesterdayHours.includes(" - ")) {
        const [oStr, cStr] = yesterdayHours.split(" - ");
        yOpen = toMinutes(oStr);
        yClose = toMinutes(cStr);
      }

      if (yOpen !== null && yClose !== null && yClose < yOpen) {
        if (now < yClose) return yesterdayDay; 
      }
    }
    
    return currentDay;
  };

  const getStoreStatus = (openingHours) => {
    if (!openingHours) return "Closed";
    
    const hoursObj = typeof openingHours === "string" ? JSON.parse(openingHours) : openingHours;
    const now = currentHour * 60 + currentMinute;

    // STEP 1: CHECK YESTERDAY'S SPILLOVER
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIndex = daysOfWeek.indexOf(currentDay);
    const yesterdayDay = daysOfWeek[(todayIndex - 1 + 7) % 7]; 
    const yesterdayHours = hoursObj[yesterdayDay];

    if (yesterdayHours) {
      let yOpen, yClose;
      if (typeof yesterdayHours === "object" && yesterdayHours.open && !yesterdayHours.isClosed) {
        yOpen = toMinutes(yesterdayHours.open);
        yClose = toMinutes(yesterdayHours.close);
      } else if (typeof yesterdayHours === "string" && yesterdayHours.includes(" - ")) {
        const [oStr, cStr] = yesterdayHours.split(" - ");
        yOpen = toMinutes(oStr);
        yClose = toMinutes(cStr);
      }
      if (yOpen !== null && yClose !== null && yClose < yOpen) {
        if (now < yClose) return "Open"; 
      }
    }

    // STEP 2: CHECK TODAY'S NORMAL HOURS
    const todayHours = hoursObj[currentDay];
    if (!todayHours) return "Closed";

    // LOGIC: HANDLE OBJECT PACKAGE
    if (typeof todayHours === "object") {
      if (todayHours.isClosed) return "Closed";
      if (todayHours.is24Hours) return "Open";
      
      const openStr = todayHours.open;
      const closeStr = todayHours.close;
      if (!openStr || !closeStr) return "Closed";

      const open = toMinutes(openStr);
      const close = toMinutes(closeStr);

      if (open === null || close === null) return "Closed";
      
      if (close < open) {
        return (now >= open || now < close) ? "Open" : "Closed";
      }
      return (now >= open && now < close) ? "Open" : "Closed";
    }

    // LOGIC: HANDLE STRING FORMAT
    if (todayHours === "Closed") return "Closed";
    if (is24Hours(todayHours)) return "Open";
    if (typeof todayHours === "string" && !todayHours.includes(" - ")) return "Closed";
    
    const [openTime, closeTime] = todayHours.split(" - ");
    if (!openTime || !closeTime) return "Closed";
    
    // Removed redundant toMinutes and redundant const now from this section
    const open = toMinutes(openTime);
    const close = toMinutes(closeTime);

    if (open === null || close === null) return "Closed";
    
    if (close < open) {
      return (now >= open || now < close) ? "Open" : "Closed";
    }
    return (now >= open && now < close) ? "Open" : "Closed";
  };

  return { currentDay, currentHour, currentMinute, getStoreStatus, getDisplayDay };
};

export default useTime;