const url = process.env.VITE_SUPABASE_URL || "https://sxebygxpjzntogzpjnga.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_T76BRIr0UCwmlPtkB3dHZA_jVPaLZli";

async function check() {
  const res = await fetch(`${url}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Error:", text);
    return;
  }
  const data = await res.json();
  if (data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("Table is empty, but fetch succeeded. Let's try to trigger an error to see columns.");
    // Force a bad insert to get the error detailing missing columns? 
    // Actually, if we do OPTIONS request, we might get the OpenAPI spec.
  }
}

check();
