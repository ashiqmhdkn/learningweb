import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    
  const body = await req.json();
  console.log("request for login"+body);
  const res = await fetch('https://api.crescentlearning.org/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log(data);

  return NextResponse.json(data, { status: res.status });
}