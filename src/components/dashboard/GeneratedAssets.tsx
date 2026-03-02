interface Asset {
  type: string;
  title: string;
  icon: string;
  timestamp: string;
}

interface GeneratedAssetsProps {
  assets: Asset[];
  /** Optional handler when user clicks "View" on an asset */
  onViewAsset?: (asset: Asset) => void;
}

export function GeneratedAssets({ assets, onViewAsset }: GeneratedAssetsProps) {

  const viewAsset = (asset: Asset) => {
    if (onViewAsset) {
      onViewAsset(asset);
      return;
    }
    // Fallback: no-op with console message instead of intrusive alert
    console.warn("View asset clicked, but no handler provided.", asset);
  };

  const chatAsset = (type: string) => {
    alert(`Opening chat refinement for ${type}!\n\nThis would allow you to refine the asset through conversation.`);
  };

  const exportAsset = (type: string) => {
    alert(`Exporting ${type} asset!\n\nThis would download the asset in your preferred format (PDF, DOCX, etc.).`);
  };

  if (assets.length === 0) {
    return null;
  }

  return (
    <div id="generated-assets-section" className="mb-12 animate-[fadeIn_0.5s_ease]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[1.55rem] font-extrabold text-primary md:text-[1.8rem]">Generated Knowledge Assets</h3>
        <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[0.67rem] font-bold uppercase tracking-[0.12em] text-primary">
          Latest first
        </span>
      </div>
      <div>
        {assets.map((asset, index) => (
          <div
            key={`${asset.type}-${asset.timestamp}-${index}`}
            className="mb-5 animate-[slideIn_0.5s_ease] rounded-2xl border border-primary/35 bg-card/55 p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <div className="mb-5 flex items-start gap-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-3xl">{asset.icon}</div>
              <div className="flex-1">
                <h4 className="mb-1 text-[1.25rem] font-bold text-foreground md:text-[1.4rem]">{asset.title}</h4>
                <p className="font-mono text-[0.78rem] text-muted-foreground">Generated: {asset.timestamp}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => viewAsset(asset)}
                className="rounded-lg bg-primary px-6 py-2.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition-all hover:bg-primary-glow hover:shadow-elegant"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => chatAsset(asset.type)}
                className="rounded-lg border border-primary px-6 py-2.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary transition-all hover:bg-primary/10"
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => exportAsset(asset.type)}
                className="flex h-[40px] w-[40px] items-center justify-center rounded-lg border border-primary/50 bg-transparent text-lg text-primary transition-all hover:border-primary hover:bg-primary/10"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
