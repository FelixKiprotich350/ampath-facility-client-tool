
async function createKenyaEMRSession() {
  // Prepare form data
  const username= process.env.KENYAEMR_API_USERNAME;
  const password= process.env.KENYAEMR_API_PASSWORD;

  // Send login request
  const baseUrl = process.env.KENYAEMR_SERVER;
  const res = await fetch(`${baseUrl}/ws/rest/v1/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      `Login failed: ${res.status} ${JSON.stringify(await res.json())}`
    );
  }

  // Extract Set-Cookie header
  const rawCookies = res.headers.get("set-cookie");
  if (!rawCookies) {
    throw new Error("No cookies returned from KenyaEMR login");
  }

  // Find JSESSIONID in cookie string
  const match = rawCookies.match(/JSESSIONID=([^;]+);/);
  if (!match) {
    throw new Error("JSESSIONID not found in cookie");
  }

  const sessionId = match[1];
  console.log("Session ID:", sessionId);
  return sessionId;
}
export default createKenyaEMRSession;
