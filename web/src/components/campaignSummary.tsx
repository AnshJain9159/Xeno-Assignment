import { useEffect, useState } from "react";

function CampaignSummary({ campaignId }: { campaignId: string }) {
  const [summary, setSummary] = useState<string>("Loading summary...");

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/summary`)
      .then(res => res.json())
      .then(data => setSummary(data.summary || "No summary available."))
      .catch(() => setSummary("Failed to load summary."));
  }, [campaignId]);

  return (
    <div className="my-4 p-4 bg-muted rounded">
      <h3 className="font-semibold mb-2">AI Campaign Summary</h3>
      <p className="text-sm">{summary}</p>
    </div>
  );
}

export default CampaignSummary