import { FUND_NAME } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      <h1 className="font-serif display-sm">{FUND_NAME}</h1>
      <div className="mt-6 mb-8 max-w-2xl">
        <h2 className="font-serif display-sm mb-5">Thesis</h2>
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          {{SITE_DESCRIPTION}}
        </p>
      </div>
      <div className="max-w-[680px] space-y-6 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Replace this text with your fund thesis. See reference/DESIGN.md for
          voice rules (sentence-case headers, no em-dashes, editorial register).
        </p>
      </div>
    </div>
  );
}
