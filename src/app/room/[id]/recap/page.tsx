import { Recap } from '@/components/recap';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Recap id={(await params).id} />;
}
