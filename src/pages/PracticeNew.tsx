import SideNav from '@/components/SideNav';

export default function PracticeNew() { 
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/practice" />
      <main className="flex-1 p-6">
        <div className="text-xl font-semibold mb-4">Adaptive Practice</div>
        <div className="text-muted-foreground">
          Adaptive Practice placeholder (Left Question Stack)
        </div>
      </main>
    </div>
  );
}
