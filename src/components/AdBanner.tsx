import React, { useEffect } from 'react';

interface AdBannerProps {
  dataAdSlot?: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
}

export default function AdBanner({ 
  dataAdSlot = "placeholder", 
  dataAdFormat = "auto", 
  dataFullWidthResponsive = true 
}: AdBannerProps) {
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // In production, initialize the ad
    if (!isDev) {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error('Google Adsense error', err);
      }
    }
  }, [isDev]);

  // For the development/preview environment, we'll show a placeholder block.
  if (isDev) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 flex flex-col items-center justify-center p-4 my-8 rounded-xl min-h-[120px] text-sm font-medium">
        <div className="text-center space-y-2">
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Advertisement Placeholder</p>
          <p className="text-xs opacity-60">data-ad-slot: {dataAdSlot}</p>
        </div>
      </div>
    );
  }

  // In production, render the actual AdSense block
  return (
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-9859645464302389"
         data-ad-slot={dataAdSlot}
         data-ad-format={dataAdFormat}
         data-full-width-responsive={dataFullWidthResponsive.toString()} />
  );
}
