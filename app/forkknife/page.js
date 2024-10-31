"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://status.epicgames.com/api/v2/status.json"
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setInfo(data);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!info) {
    return <div>Loading...</div>; // Loading state
  }

  return (
    <div className="fkbody">
      <h1>FORK-KNIFE WAITINGROOM</h1>
      <div className="container">
        <div className="box online">
          <div className="status green">SERVER</div>
          <div className="info">
            <div className="label">Name: {info.page.name}</div>
            <div className="label">Timezone: {info.page.timezone}</div>
            <div className="label">Updated At: {info.page.updated_at}</div>
          </div>
        </div>

        <div className="box disabled">
          <div className="status red">STATUS</div>
          <div className="info">
            <div className="label">Indicator: {info.status.indicator}</div>
            <div className="label">Description: {info.status.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
