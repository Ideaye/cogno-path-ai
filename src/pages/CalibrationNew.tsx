import SideNav from '@/components/SideNav';

export default function CalibrationNew() { 
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/calibration" />
      <main className="flex-1 p-6">
        <div className="text-xl font-semibold mb-4">Calibration Lab</div>
        <div className="text-muted-foreground">
          Calibration Lab placeholder (existing component can be mounted here)
        </div>
      </main>
    </div>
  );
}
