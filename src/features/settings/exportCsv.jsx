import { useState } from 'react'

import { exportUserDataAsCSV } from "../../utils/exportCsv";
import { supabase } from "../../lib/supabase";

export function ExportButton({ userId }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await exportUserDataAsCSV(supabase, userId);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="bg-blue-500 hover:bg-blue-500/80 rounded-lg" onClick={handleClick} disabled={loading}>
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}