const BASE = "http://localhost:4000/api"; // ✅ FIXED PORT

async function safeFetch(url, options = {}) {
  console.log("➡️", url);

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    console.log("⬅️", data);

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;

  } catch (err) {
    console.error("❌", err.message);
    throw err;
  }
}

export async function generateLayout(prompt) {
  const data = await safeFetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  return data.layout;
}

export async function refineLayout(currentLayout, instruction) {
  const data = await safeFetch(`${BASE}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentLayout, instruction }),
  });

  return data.layout;
}

export async function checkHealth() {
  return await safeFetch(`${BASE}/health`);
}