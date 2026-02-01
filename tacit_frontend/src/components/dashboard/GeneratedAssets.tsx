"use client";

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
      <h3 className="text-[1.8rem] font-extrabold text-[#10b981] mb-8">Generated Knowledge Assets</h3>
      <div>
        {assets.map((asset, index) => (
          <div
            key={`${asset.type}-${asset.timestamp}-${index}`}
            className="bg-[rgba(42,42,42,0.5)] border-2 border-[#10b981] rounded-2xl p-8 mb-6 transition-all hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 animate-[slideIn_0.5s_ease]"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="text-5xl flex-shrink-0">{asset.icon}</div>
              <div className="flex-1">
                <h4 className="text-[1.5rem] font-bold text-white mb-2">{asset.title}</h4>
                <p className="text-[#a0a0a0] text-[0.85rem] font-mono">Generated: {asset.timestamp}</p>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => viewAsset(asset.type)}
                className="bg-[#10b981] text-[#0a0a0a] px-8 py-3 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none hover:bg-[#14d89a] hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)]"
              >
                View
              </button>
              <button
                onClick={() => chatAsset(asset.type)}
                className="bg-transparent border-2 border-[#10b981] text-[#10b981] px-8 py-3 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all hover:bg-[rgba(16,185,129,0.1)]"
              >
                Chat
              </button>
              <button
                onClick={() => exportAsset(asset.type)}
                className="bg-transparent border-2 border-[rgba(16,185,129,0.5)] text-[#10b981] px-4 py-3 rounded-lg text-xl cursor-pointer transition-all flex items-center justify-center w-[45px] h-[45px] hover:border-[#10b981] hover:bg-[rgba(16,185,129,0.1)]"
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

