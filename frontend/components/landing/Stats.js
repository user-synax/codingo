/* Stats / Social Proof section — big numbers that convey scale and
   trust. Server component. Centered layout with three key metrics. */

export function Stats() {
  const stats = [
    { value: "30+", label: "lessons" },
    { value: "6", label: "exercise types" },
    { value: "100%", label: "free forever" },
  ];

  return (
    <section className="bg-paper-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16 md:gap-24">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <span className="font-feather text-[40px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[48px]">
                {stat.value}
              </span>
              <span className="font-codingo-sans text-[15px] leading-[1.33] font-bold uppercase tracking-[0.795px] text-pencil-gray">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
