import { RoomEntry } from '@/components/room-entry';
import { notFound } from 'next/navigation';
import { validMeetingId } from '@/lib/ids';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validMeetingId(id)) notFound();
  return <RoomEntry id={id} />;
}
