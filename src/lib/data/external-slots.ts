"use server"

export async function fetchTherapistSlots() {
  const res = await fetch("https://knightsbridge.heartitout.in/webhook/api/hio/services/get_all_slots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      therapist_id: "10",
      loc_id: "2",
      service_id: "13",
      get_more: 0,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch slots")
  }

  return res.json()
}