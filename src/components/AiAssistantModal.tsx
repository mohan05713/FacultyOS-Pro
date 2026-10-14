import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Award,
  Users,
  Bell,
  CheckCircle,
  Copy,
  X,
  Send,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { FacultyProfile } from '../types/database';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFaculty: FacultyProfile | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentFaculty,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('lesson_plan');
  const [isLoading, setIsLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'lesson_plan',
      label: 'Draft Lesson Plan',
      icon: BookOpen,
      placeholder: 'Enter subject, unit, and concept to generate a 50-minute teaching outline...',
      defaultPrompt: 'Generate a college-level 50-minute lesson plan for "Two-Phase Locking (2PL) and Deadlock Handling in Distributed Databases" including Bloom objectives, teaching methodology, whiteboard diagram suggestions, and 2 check-for-understanding questions.',
    },
    {
      id: 'quiz',
      label: 'Generate Quiz Questions',
      icon: HelpCircle,
      placeholder: 'Enter subject, topic, and difficulty to produce 5 exam questions with answers...',
      defaultPrompt: 'Generate 4 challenging conceptual exam questions on "Raft Consensus Log Compaction and Snapshotting" with Bloom taxonomy ratings and model solutions.',
    },
    {
      id: 'rubric',
      label: 'Design Project Rubric',
      icon: Award,
      placeholder: 'Enter assignment or project title to generate a transparent grading rubric...',
      defaultPrompt: 'Create a 4-tier grading rubric (Exemplary, Proficient, Developing, Inadequate) for a "Capstone Microservices Project" evaluating architecture, test coverage, and documentation.',
    },
    {
      id: 'remedial',
      label: 'Remedial Action Strategy',
      icon: Users,
      placeholder: 'Describe student learning bottleneck to formulate supportive remedial steps...',
      defaultPrompt: 'Formulate a 3-week empathetic remedial practice schedule for engineering students struggling with asymptotic recurrence relations and dynamic programming.',
    },
    {
      id: 'circular',
      label: 'Draft Academic Circular',
      icon: Bell,
      placeholder: 'Enter key announcement details for department circular...',
      defaultPrompt: 'Draft an official department circular announcing the upcoming Mid-Semester Examination schedule, invigilation guidelines, and question paper submission deadlines.',
    },
  ];

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = presets.find((pr) => pr.id === presetId);
    if (p) {
      setPrompt(p.defaultPrompt);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResponseOutput('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: `You are FacultyOS AI Teaching Assistant, a distinguished university academic dean and professor. You assist college faculty members in drafting rigorous, pedagogical, syllabus-compliant, and high-quality academic materials. Output formatted markdown with clear headers and bullet points. Always add a concluding disclaimer reminding the faculty member that all generated drafts must be critically reviewed and validated before saving.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setResponseOutput(data.text);
      } else {
        setErrorMsg(data.error || 'Failed to generate response. Please ensure GEMINI_API_KEY is configured in AI Studio Secrets.');
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Teaching Copilot
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Academic productivity assistant for professors, coordinators & mentors
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={presets.find((p) => p.id === selectedPreset)?.placeholder}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Faculty review required before saving. Student privacy protected.
            </span>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Synthesizing Academic Draft...' : 'Generate Academic Draft'}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Output Area */}
        {responseOutput && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Generated Academic Draft
              </span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied to Clipboard!' : 'Copy Draft'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {responseOutput}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
