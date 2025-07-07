export const runtime = 'nodejs'; 

export async function POST(req) {
  try {
    const formData = await req.formData();
    const response = await fetch('https://script.google.com/macros/s/AKfycbzuXi2eQoBaO290B527dtmIYabKRYXdQSfPpmWp7NOGnirhLLO955cIveXP9bywGm7f/exec', { method: 'POST', body: formData, duplex: 'half' });
    const message = await response.json();

    return Response.json(message);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to store message." },
      { status: 500 }
    );
  }
}