
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')


function encodeBase64(data: Uint8Array): string {
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function sendEmail(to: string, fileName: string, fileData: Uint8Array): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'temp@fulfily.eu', ///////  CHANGE BACK TO pb@fulfily.eu
      to,
      subject: "Book upload",
      html: 'Book that is uploaded to Pocketbook using "send to Pocketbook" feature',
      attachments: [
      {
        filename: fileName,
        content: encodeBase64(fileData),
      },
    ],
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Failed to send email:', data);
    throw new Error('Email send failed');
  } else {
    console.log('Email sent successfully:', data);
  }
}