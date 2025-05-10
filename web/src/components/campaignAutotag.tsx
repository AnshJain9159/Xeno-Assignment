import { useState } from "react";
import { Button } from "@/components/ui/button";

function CampaignTags({ campaignId, initialTags }: { campaignId: string, initialTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [loading, setLoading] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/autotag`, { method: "POST" });
    const data = await res.json();
    setTags(data.tags || []);
    setLoading(false);
  };

  return (
    <div className="my-4 p-4 bg-muted rounded">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold">AI Tags</h3>
        <Button size="sm" onClick={fetchTags} disabled={loading}>
          {loading ? "Tagging..." : "Auto-tag"}
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tags.length > 0 ? tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-primary/10 rounded text-xs">{tag}</span>
        )) : <span className="text-xs text-muted-foreground">No tags yet.</span>}
      </div>
    </div>
  );
}

export default CampaignTags