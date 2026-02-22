"use client";

import { useState } from "react";
import { MessageSquare, Headphones } from "lucide-react";
import SupportTicketModal from "./SupportTicketModal";

export default function SupportTicketButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105"
      >
        {/* Icon */}
        <div className="relative">
          <Headphones className="h-6 w-6" />
          {/* Pulse animation */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </div>
        
        {/* Text */}
        <span>Get Support</span>
      </button>

      {/* Modal */}
      <SupportTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}