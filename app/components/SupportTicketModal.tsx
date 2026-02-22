"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { X, Send, AlertCircle, CheckCircle, Paperclip, Loader2 } from "lucide-react";

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Priority = "low" | "medium" | "high" | "urgent";
type Category = 
  | "technical" 
  | "billing" 
  | "feature-request" 
  | "bug-report" 
  | "account" 
  | "other";

interface FormData {
  name: string;
  email: string;
  subject: string;
  category: Category;
  priority: Priority;
  description: string;
  attachments: File[];
}

export default function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    category: "technical",
    priority: "medium",
    description: "",
    attachments: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (!isOpen) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );

      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }
      );
    });

    return () => ctx.revert();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setStatus("submitting");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success (in real app, this would be actual API response)
    setStatus("success");

    // Reset form after success
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "technical",
        priority: "medium",
        description: "",
        attachments: [],
      });
      setStatus("idle");
      onClose();
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      alert("Some files were too large (max 10MB per file)");
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles].slice(0, 5) // Max 5 files
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className=" inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-zinc-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-zinc-200 bg-white px-8 py-6">
          <div>
            <h2 className="text-3xl font-black text-zinc-900">Submit Support Ticket</h2>
            <p className="text-sm text-zinc-600 mt-1">We'll get back to you within 24 hours</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-100 p-3 text-zinc-900 hover:bg-zinc-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Success Message */}
          {status === "success" && (
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900">Ticket Submitted Successfully!</div>
                <div className="text-sm text-emerald-700 mt-1">
                  You'll receive a confirmation email shortly. Ticket ID: #TKT-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition ${
                  errors.name 
                    ? "border-red-300 bg-red-50" 
                    : "border-zinc-200 bg-white focus:border-orange-500"
                }`}
                placeholder="John Doe"
                disabled={status !== "idle"}
              />
              {errors.name && (
                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition ${
                  errors.email 
                    ? "border-red-300 bg-red-50" 
                    : "border-zinc-200 bg-white focus:border-orange-500"
                }`}
                placeholder="john@example.com"
                disabled={status !== "idle"}
              />
              {errors.email && (
                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 border-zinc-200 bg-white focus:border-orange-500 transition"
                disabled={status !== "idle"}
              >
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Payments</option>
                <option value="feature-request">Feature Request</option>
                <option value="bug-report">Bug Report</option>
                <option value="account">Account Issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    className={`rounded-lg px-3 py-2 text-xs font-bold border-2 transition capitalize ${
                      formData.priority === p 
                        ? getPriorityColor(p)
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                    disabled={status !== "idle"}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition ${
                errors.subject 
                  ? "border-red-300 bg-red-50" 
                  : "border-zinc-200 bg-white focus:border-orange-500"
              }`}
              placeholder="Brief description of your issue"
              disabled={status !== "idle"}
            />
            {errors.subject && (
              <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.subject}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition resize-none ${
                errors.description 
                  ? "border-red-300 bg-red-50" 
                  : "border-zinc-200 bg-white focus:border-orange-500"
              }`}
              placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
              disabled={status !== "idle"}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </div>
              ) : (
                <div className="text-xs text-zinc-500">
                  {formData.description.length} characters (min. 20)
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-2">
              Attachments (Optional)
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-600 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition"
                disabled={status !== "idle" || formData.attachments.length >= 5}
              >
                <Paperclip className="h-5 w-5 mx-auto mb-2" />
                Click to upload files (Max 5 files, 10MB each)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              {/* File List */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-zinc-100 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Paperclip className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition ml-3"
                        disabled={status !== "idle"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-zinc-100 px-6 py-4 text-sm font-bold text-zinc-900 hover:bg-zinc-200 transition"
              disabled={status === "submitting"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-xl px-6 py-4 text-sm font-bold text-white transition flex items-center justify-center gap-2 ${
                status === "submitting"
                  ? "bg-orange-400 cursor-not-allowed"
                  : status === "success"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl"
              }`}
              disabled={status !== "idle"}
            >
              {status === "submitting" && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="h-5 w-5" />
              )}
              {status === "submitting" ? "Submitting..." : status === "success" ? "Submitted!" : "Submit Ticket"}
            </button>
          </div>

          {/* Help Text */}
          <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4 text-sm text-blue-800">
            <div className="font-bold mb-1">💡 Tips for faster resolution:</div>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Be as specific as possible about your issue</li>
              <li>Include screenshots or error messages if applicable</li>
              <li>Mention your browser/device if it's a technical issue</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}