import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { PubMedArticle } from '../types';
import { fetchPubMedStrokeResearch } from '../services/api';

export const ScienceEvidenceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTopic, setSearchTopic] = useState<string>('stroke rehabilitation mirror therapy eye tracking');

  const loadScienceData = async (queryTopic: string) => {
    setLoading(true);
    const data = await fetchPubMedStrokeResearch(queryTopic);
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadScienceData(searchTopic);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="max-w-2xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                PubMed Science & Clinical Literature Grounding
              </h3>
              <p className="text-xs text-slate-400">
                Peer-reviewed stroke rehabilitation protocols & eye-tracking communication research
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>

        {/* Quick Topics Pill Bar */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: 'Mirror Therapy', query: 'stroke rehabilitation mirror therapy' },
            { label: 'Eye Aspect Ratio (EAR)', query: 'eye blink ratio stroke locked in syndrome' },
            { label: 'Constraint Therapy (CIMT)', query: 'constraint induced movement therapy stroke' },
            { label: 'Aspiration & Dysphagia', query: 'stroke dysphagia aspiration prevention chin tuck' },
          ].map((topic) => (
            <button
              key={topic.label}
              onClick={() => {
                setSearchTopic(topic.query);
                loadScienceData(topic.query);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                searchTopic === topic.query
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>

        {/* Article List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-10 text-center space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-cyan-400" />
              <p className="text-xs text-slate-400 font-mono">
                Querying NCBI Entrez E-Utilities & PubMed API...
              </p>
            </div>
          ) : (
            articles.map((art) => (
              <div
                key={art.pmid}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/40 transition-all space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    PMID: {art.pmid}
                  </span>
                  <span className="text-[11px] text-slate-400">{art.pubdate}</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{art.title}</h4>

                <p className="text-xs text-slate-300 font-mono">{art.source}</p>
                <p className="text-[11px] text-slate-400">Authors: {art.authors}</p>

                <div className="pt-2 flex justify-end">
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>View on PubMed</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Conforms to NCBI PubMed E-Utilities Service Guidelines
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
