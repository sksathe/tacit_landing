interface Asset {
  type: string;
  title: string;
  icon: string;
  timestamp: string;
}

interface GeneratedAssetsProps {
  assets: Asset[];
}

export function GeneratedAssets({ assets }: GeneratedAssetsProps) {

  const viewAsset = (type: string) => {
    alert(`Opening ${type} asset viewer!\n\nThis would display the generated content in a full viewer.`);
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
      <h3 className="text-[1.8rem] font-extrabold text-primary mb-8">Generated Knowledge Assets</h3>
      <div>
        {assets.map((asset, index) => (
          <div
            key={`${asset.type}-${asset.timestamp}-${index}`}
            className="bg-card/50 border-2 border-primary rounded-2xl p-8 mb-6 transition-all hover:shadow-elegant hover:-translate-y-0.5 animate-[slideIn_0.5s_ease]"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="text-5xl flex-shrink-0">{asset.icon}</div>
              <div className="flex-1">
                <h4 className="text-[1.5rem] font-bold text-foreground mb-2">{asset.title}</h4>
                <p className="text-muted-foreground text-[0.85rem] font-mono">Generated: {asset.timestamp}</p>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => viewAsset(asset.type)}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none hover:bg-primary-glow hover:shadow-elegant"
              >
                View
              </button>
              <button
                onClick={() => chatAsset(asset.type)}
                className="bg-transparent border-2 border-primary text-primary px-8 py-3 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all hover:bg-primary/10"
              >
                Chat
              </button>
              <button
                onClick={() => exportAsset(asset.type)}
                className="bg-transparent border-2 border-primary/50 text-primary px-4 py-3 rounded-lg text-xl cursor-pointer transition-all flex items-center justify-center w-[45px] h-[45px] hover:border-primary hover:bg-primary/10"
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
