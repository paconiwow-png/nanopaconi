import React from 'react';
import { Icon } from './common/Icon';
import { Tool } from '../types';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const tools = [
  { id: Tool.GENERATE, name: 'AI Generate', icon: 'sparkles' },
  { id: Tool.EDIT, name: 'AI Edit', icon: 'magic' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool }) => {
  return (
    <nav className="flex-shrink-0 w-20 bg-brand-gray-800 p-2 flex flex-col items-center gap-4">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`relative group flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 ${
            activeTool === tool.id
              ? 'bg-neon-blue/20 text-neon-blue'
              : 'text-brand-gray-300 hover:bg-brand-gray-700 hover:text-white'
          }`}
          aria-label={tool.name}
        >
          <Icon name={tool.icon} className="w-7 h-7" />
          <span className="text-xs mt-1">{tool.name}</span>
          {activeTool === tool.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue rounded-r-full"></div>}
        </button>
      ))}
    </nav>
  );
};
