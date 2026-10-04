const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Insert LiveClock component definition
const liveClockCode = `
const LiveClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="h-4"></div>;

  return (
    <div className="text-[11px] xl:text-[12px] font-medium text-slate-500 flex items-center mt-0.5">
      {time.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} - {time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </div>
  );
};
`;

if (!c.includes('const LiveClock')) {
  // Put it before `export default function DashboardLayout`
  c = c.replace(
    'export default function DashboardLayout',
    liveClockCode + '\nexport default function DashboardLayout'
  );
}

// Replace the header block
const searchBlock = `<div className="hidden md:flex items-center min-w-0 truncate">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate">
              {currentPageName}
            </h2>
          </div>`;
          
// Wait, the indentations might vary. Let's use regex.
const regex = /<div className="hidden md:flex items-center min-w-0 truncate">\s*<h2 className="text-lg font-bold text-slate-800 tracking-tight truncate">\s*\{currentPageName\}\s*<\/h2>\s*<\/div>/g;

const replacement = `<div className="hidden md:flex flex-col min-w-0 truncate justify-center">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate leading-tight">
              {currentPageName}
            </h2>
            <LiveClock />
          </div>`;

c = c.replace(regex, replacement);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Added live clock');
