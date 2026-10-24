import { redirect } from "next/navigation";

// Target of the QR/NFC tag at a place or seat: open that exact place.
export default async function Tag({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const safe = /^[A-Za-z0-9_-]{16,64}$/.test(code) ? code : "";
  redirect(safe ? `/place?tag=${safe}` : "/place");
}
