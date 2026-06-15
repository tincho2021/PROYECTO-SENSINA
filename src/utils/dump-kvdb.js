import fetch from 'node-fetch';

async function main() {
  const bucket = "7b3mwrCjYKfthbbugjqh4k";
  try {
    const res = await fetch(`https://kvdb.io/${bucket}/latest-dispenser-status`);
    if (res.ok) {
      const json = await res.json();
      console.log("=== FULL LATEST DISPENSER STATUS ===");
      console.log(JSON.stringify(json, null, 2));
    } else {
      console.log("Status lookup failed:", res.status);
    }
  } catch (err) {
    console.log("Error:", err.message);
  }
}
main();
