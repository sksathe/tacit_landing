"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface StartSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function StartSessionModal({ open, onClose }: StartSessionModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sessionTitle: "",
    inviteeEmail: "",
    sessionNotes: "",
  });

  const agents = [
    { id: "rachael", name: "Rachael", description: "Finance Expert", icon: "👩" },
    { id: "ross", name: "Ross", description: "Compliance Specialist", icon: "👨" },
    { id: "monica", name: "Monica", description: "Operations Manager", icon: "👩‍💼" },
    { id: "chandler", name: "Chandler", description: "Data Analyst", icon: "👨‍💻" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgent && formData.sessionTitle && formData.inviteeEmail) {
      alert(
        `Session Started!\n\nAgent: ${selectedAgent}\nTitle: ${formData.sessionTitle}\nInvitee: ${formData.inviteeEmail}\n\nIn a real application, an email with your unique phone number would be sent to the SME.`
      );
      onClose();
      setSelectedAgent(null);
      setFormData({ sessionTitle: "", inviteeEmail: "", sessionNotes: "" });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border-2 border-[#10b981] rounded-[20px] p-12 max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-[#a0a0a0] text-[2rem] cursor-pointer transition-colors leading-none hover:text-[#10b981]"
        >
          ×
        </button>
        <h2 className="text-[2rem] font-extrabold text-[#10b981] mb-4 text-center">
          Start New Tacit Session NOW
        </h2>
        <p className="text-[#a0a0a0] mb-8 text-center text-base">
          Select an agent and provide the session & human SME details. Your invitee will receive your unique phone
          number for selected agent upon submission.
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 mb-8">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`bg-[rgba(42,42,42,0.5)] border-2 rounded-2xl p-6 cursor-pointer transition-all text-center ${
                selectedAgent === agent.id
                  ? "border-[#10b981] bg-[rgba(16,185,129,0.1)]"
                  : "border-[rgba(16,185,129,0.3)] hover:border-[#10b981]"
              }`}
            >
              <div className="text-5xl mb-4">{agent.icon}</div>
              <div className="text-[1.2rem] font-bold text-white mb-1">{agent.name}</div>
              <div className="text-[#a0a0a0] text-[0.95rem]">{agent.description}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mb-6">
            <label htmlFor="sessionTitle" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              Session Title
            </label>
            <input
              type="text"
              id="sessionTitle"
              value={formData.sessionTitle}
              onChange={(e) => setFormData({ ...formData, sessionTitle: e.target.value })}
              placeholder="e.g., Payment Gateway Integration"
              required
              className="w-full bg-[rgba(26,26,26,0.8)] border-2 border-[rgba(16,185,129,0.3)] rounded-lg px-4 py-3 text-white text-base transition-all focus:outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="inviteeEmail" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              SME Email (Invitee)
            </label>
            <input
              type="email"
              id="inviteeEmail"
              value={formData.inviteeEmail}
              onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
              placeholder="expert@company.com"
              required
              className="w-full bg-[rgba(26,26,26,0.8)] border-2 border-[rgba(16,185,129,0.3)] rounded-lg px-4 py-3 text-white text-base transition-all focus:outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="sessionNotes" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              Session Notes (Optional)
            </label>
            <textarea
              id="sessionNotes"
              value={formData.sessionNotes}
              onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
              placeholder="Any specific topics or areas to focus on..."
              rows={4}
              className="w-full bg-[rgba(26,26,26,0.8)] border-2 border-[rgba(16,185,129,0.3)] rounded-lg px-4 py-3 text-white text-base transition-all focus:outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] resize-vertical min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedAgent || !formData.sessionTitle || !formData.inviteeEmail}
            className="w-full bg-[#10b981] text-[#0a0a0a] px-5 py-4 rounded-xl text-[1.1rem] font-bold cursor-pointer transition-all border-none shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:bg-[#14d89a] hover:shadow-[0_8px_25px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4"
          >
            Submit & Send Invite
          </button>
        </form>
      </div>
    </div>
  );
}


