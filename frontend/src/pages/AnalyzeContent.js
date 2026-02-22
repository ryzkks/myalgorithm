import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Loader2, Link2, FileText, Hash, Clock, Pen, Lock, Star, Heart, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisSkeleton } from "@/components/SkeletonCards";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AnalyzeContent() {
  const { user } = useAuth();
  const [mode, setMode] = useState("link"); // "link" or "text"
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const plan = user?.plan || "free";
  const features = user?.features || {};

  const detectPlatform = (u) => {
    const l = u.toLowerCase();
    if (l.includes("youtube.com") || l.includes("youtu.be")) return "youtube";
    if (l.includes("tiktok.com")) return "tiktok";
    if (l.includes("instagram.com")) return "instagram";
    return null;
  };

  const handleAnalyzeLink = async () => {
    if (!url.trim()) { toast.error("Paste a video URL"); return; }
    const detected = detectPlatform(url);
    if (!detected) { toast.error("Paste a TikTok, Instagram, or YouTube link"); return; }
    setLoading(true); setResult(null); setVideoData(null);
    try {
      const res = await axios.post(`${API}/analyze/video-link`, { url }, { withCredentials: true });
      setResult(res.data); setVideoData(res.data.video_data);
      setRemaining(res.data.remaining_today);
      if (res.data.xp_earned) toast.success(`+${res.data.xp_earned} XP earned!`);
      if (res.data.new_achievements?.length) {
        res.data.new_achievements.forEach(a => toast.success(`Achievement unlocked: ${a}`));
      }
    } catch (err) {
      if (err.response?.status === 429) toast.error(err.response.data.detail);
      else toast.error("Analysis failed. Try again.");
    } finally { setLoading(false); }
  };

  const handleAnalyzeText = async () => {
    if (!content.trim()) { toast.error("Enter content to analyze"); return; }
    setLoading(true); setResult(null); setVideoData(null);
    try {
      const res = await axios.post(`${API}/analyze/content`, { content, platform }, { withCredentials: true });
      setResult(res.data);
      setRemaining(res.data.remaining_today);
      if (res.data.xp_earned) toast.success(`+${res.data.xp_earned} XP earned!`);
      if (res.data.new_achievements?.length) {
        res.data.new_achievements.forEach(a => toast.success(`Achievement unlocked: ${a}`));
      }
    } catch (err) {
      if (err.response?.status === 429) toast.error(err.response.data.detail);
      else toast.error("Analysis failed");
    } finally { setLoading(false); }
  };

  const handleFavorite = async (analysisId) => {
    if (!features.favorites) {
      toast.error("Favorites require Pro plan. Upgrade to save analyses.");
      return;
    }
    try {
      const res = await axios.post(`${API}/analyses/favorite`, { analysis_id: analysisId }, { withCredentials: true });
      setResult(prev => ({ ...prev, _favorited: res.data.favorited }));
      toast.success(res.data.favorited ? "Added to favorites" : "Removed from favorites");
    } catch { toast.error("Failed to toggle favorite"); }
  };

  const scoreColor = (s) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-cyan-400" : s >= 40 ? "text-amber-400" : "text-red-400";
  const scoreBarColor = (s) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-cyan-500" : s >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-8" data-testid="analyze-content-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Analyze Content</h1>
          <p className="text-slate-400">Get AI-powered insights on your content</p>
        </div>
        {remaining !== null && remaining >= 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50" data-testid="remaining-count">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400"><span className="text-white font-medium">{remaining}</span> analyses left today</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <div className="glass-card rounded-2xl p-6 space-y-5" data-testid="analyze-input-panel">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl" data-testid="mode-toggle">
            <button onClick={() => setMode("link")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === "link" ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "text-slate-500 hover:text-slate-300"
              }`} data-testid="mode-link-btn">
              <Link2 className="w-4 h-4" /> Video Link
            </button>
            <button onClick={() => setMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === "text" ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "text-slate-500 hover:text-slate-300"
              }`} data-testid="mode-text-btn">
              <FileText className="w-4 h-4" /> Text / Caption
            </button>
          </div>

          {mode === "link" ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2 block">Video URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@user/video/... or YouTube/Instagram link"
                  className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl"
                  data-testid="video-url-input"
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzeLink()}
                />
                {url && detectPlatform(url) && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 animate-[fade-up_0.3s_ease-out_forwards]">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase">
                      {detectPlatform(url)} detected
                    </span>
                  </div>
                )}
              </div>
              <Button onClick={handleAnalyzeLink} disabled={loading} data-testid="analyze-link-btn"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting & Analyzing...</> :
                  <><Sparkles className="w-4 h-4 mr-2" /> Analyze Video</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2 block">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-800 text-white h-11 rounded-xl" data-testid="platform-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="tiktok" className="text-white">TikTok</SelectItem>
                    <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                    <SelectItem value="youtube" className="text-white">YouTube</SelectItem>
                    <SelectItem value="general" className="text-white">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2 block">Content / Caption / Script</label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your caption, script, or content description..."
                  className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 min-h-[180px] rounded-xl resize-none"
                  data-testid="content-textarea" />
              </div>
              <Button onClick={handleAnalyzeText} disabled={loading} data-testid="analyze-text-btn"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> :
                  <><Sparkles className="w-4 h-4 mr-2" /> Analyze Content</>}
              </Button>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="glass-card rounded-2xl p-6 min-h-[400px]" data-testid="analyze-results-panel">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-cyan-500/40" />
              </div>
              <p className="text-slate-400 text-sm">{mode === "link" ? "Paste a video link to get started" : "Enter content and analyze"}</p>
            </div>
          )}

          {loading && <AnalysisSkeleton />}

          {result && (
            <div className="space-y-6 animate-[fade-up_0.5s_ease-out]">
              {/* Video metadata (if link mode) */}
              {videoData && (videoData.title || videoData.thumbnail) && (
                <div className="flex gap-3 p-3 bg-white/[0.02] rounded-xl border border-slate-800/50" data-testid="video-metadata">
                  {videoData.thumbnail && (
                    <img src={videoData.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    {videoData.title && <p className="text-sm text-white font-medium truncate">{videoData.title}</p>}
                    {videoData.author && <p className="text-xs text-slate-500">by {videoData.author}</p>}
                    {videoData.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {videoData.hashtags.slice(0, 5).map(h => (
                          <span key={h} className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Viral Score */}
              <div className="text-center" data-testid="viral-score-display">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Viral Potential Score</p>
                  {result.analysis_id && (
                    <button onClick={() => handleFavorite(result.analysis_id)}
                      className="p-1 rounded-lg hover:bg-white/5 transition-colors" data-testid="favorite-btn">
                      <Heart className={`w-4 h-4 ${result._favorited ? "text-red-400 fill-red-400" : "text-slate-600 hover:text-slate-400"} transition-colors`} />
                    </button>
                  )}
                </div>
                <div className={`text-6xl font-bold font-['Outfit'] ${scoreColor(result.viral_score)} mb-2 transition-all`}>
                  {result.viral_score}
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor(result.viral_score)}`}
                    style={{ width: `${result.viral_score}%` }} />
                </div>
              </div>

              {result.summary && (
                <p className="text-sm text-slate-300 bg-white/[0.02] rounded-xl p-4 border border-slate-800/50" data-testid="analysis-summary">{result.summary}</p>
              )}

              {/* Strengths */}
              <Section icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} title="Strengths" items={result.strengths} color="emerald" testId="analysis-strengths" />
              {/* Weaknesses */}
              <Section icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} title="Weaknesses" items={result.weaknesses} color="amber" testId="analysis-weaknesses" />
              {/* Suggestions */}
              <Section icon={<Lightbulb className="w-4 h-4 text-cyan-400" />} title="Suggestions" items={result.suggestions} color="cyan" testId="analysis-suggestions" />

              {/* Pro features */}
              {result.hashtag_recommendations && (
                <div data-testid="hashtag-recommendations">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Optimized Hashtags</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">PRO</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtag_recommendations.map((h, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">{h.startsWith("#") ? h : `#${h}`}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.best_posting_times && (
                <div data-testid="best-posting-times">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Best Posting Times</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.best_posting_times.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-white/[0.03] text-slate-300 text-xs border border-slate-800/50">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium features */}
              {result.script_suggestion && (
                <div data-testid="script-suggestion">
                  <div className="flex items-center gap-2 mb-2">
                    <Pen className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Script Suggestion</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">PREMIUM</span>
                  </div>
                  <p className="text-sm text-slate-300 bg-white/[0.02] rounded-xl p-4 border border-slate-800/50 italic">{result.script_suggestion}</p>
                </div>
              )}

              {/* Locked features for free users */}
              {!features?.advanced && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-slate-700 text-center" data-testid="pro-upsell">
                  <Lock className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-2">Upgrade to Pro for hashtag recommendations, posting times & advanced insights</p>
                  <a href="/dashboard/billing" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Upgrade Now &rarr;</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, items, color, testId }) {
  if (!items?.length) return null;
  return (
    <div data-testid={testId}>
      <div className="flex items-center gap-2 mb-3">{icon}<h3 className="text-sm font-semibold text-white">{title}</h3></div>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2 opacity-0 animate-[fade-up_0.3s_ease-out_forwards]" style={{ animationDelay: `${i * 80}ms` }}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${color}-400 mt-1.5 flex-shrink-0`} />{s}
          </li>
        ))}
      </ul>
    </div>
  );
}
