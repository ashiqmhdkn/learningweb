import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log("request for profile");
  const token = req.headers.get('authorization') || '';

  const res = await fetch('https://api.crescentlearning.org/profile', {
    headers: {
      Accept: 'application/json',
      Authorization:token,
    },
  });

  const data = await res.json();
  console.log(data);

  return NextResponse.json(data, { status: res.status });
}