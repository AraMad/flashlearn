import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <div className="mt-auto pt-12 pb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
      <p className="text-sm text-slate-500 font-medium">
        Demo AI app by <a href="https://www.starksoft.online/ai-powered-prototyping-service-starksoft?utm_source=demoapp&utm_medium=flashlearn&utm_campaign=footer" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline decoration-slate-600 hover:text-accent hover:decoration-accent transition-all">StarkSoft</a>
      </p>
      <div className="flex items-center gap-3">
        <a 
          href="https://www.instagram.com/stark.soft/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-500 hover:text-accent hover:border-accent/50 transition-all hover:scale-110"
          aria-label="Instagram"
        >
          <Instagram size={16} />
        </a>
        <a 
          href="https://www.linkedin.com/company/starksoft/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-500 hover:text-accent hover:border-accent/50 transition-all hover:scale-110"
          aria-label="LinkedIn"
        >
          <Linkedin size={16} />
        </a>
      </div>
    </div>
  );
};
