import React from 'react';

interface LauncherCardProps {
    title: string;
    description: string;
    buttonText?: string;
    onClick?: () => void;
    primary?: boolean;
}

export const LauncherCard: React.FC<LauncherCardProps> = ({
    title,
    description,
    buttonText = "Open",
    onClick,
    primary = false
}) => {
    return (
        <div className={`
      relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-6 
      transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10
      flex flex-col h-full backdrop-blur-sm
      ${primary ? 'border-cyan-500/30' : ''}
    `}>
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>

            <div className="mt-auto pt-4">
                <button
                    onClick={onClick}
                    className={`
            w-full py-2 px-4 rounded-lg font-medium text-sm
            transition-colors duration-200
            ${primary
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/20'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'}
          `}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};
