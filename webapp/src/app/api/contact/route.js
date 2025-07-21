import { NextResponse } from "next/server";

export const runtime = 'nodejs'; 

export async function POST(req) {
  try {
    const formData = await req.formData();
    const response = await fetch('https://script.google.com/macros/s/AKfycbyrdIKQAe0wQFWitN9-u87xo3Coj0nxHYHqL-GlNvamGOzTaeC_wPUQimumgQsazdsh/exec', { method: 'POST', body: formData, duplex: 'half' });
    const message = await response.json();

    return NextResponse.json(message);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to store message." },
      { status: 500 }
    );
  }
}