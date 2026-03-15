export async function exportUserDataAsCSV(supabaseClient, userId) {
  // 1. Fetch the user's data
  const { data, error } = await supabaseClient
    .from("transactions")           // replace with your table name
    .select("type, amount, currency, merchant, category_name, note, transaction_date") // specify the columns you want
    .eq("user_id", userId);   // filter to current user's rows

  if (error) throw error;
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }

  // 2. Convert to CSV string
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const csvString = csvRows.join("\n");

  // 3. Trigger browser download
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-data-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}