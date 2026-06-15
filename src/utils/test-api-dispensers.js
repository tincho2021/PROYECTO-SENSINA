import fetch from 'node-fetch';

async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/all-data');
    if (res.ok) {
      const data = await res.json();
      console.log("=== DISPENSERS IN MEMORY ===");
      console.log(JSON.stringify(data.dispensers || [], null, 2));
    } else {
      console.log("API failed:", res.status);
    }
  } catch (err) {
    console.log("Error:", err.message);
  }
}
main();
