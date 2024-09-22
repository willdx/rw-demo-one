import React from "react";

const FlowChartSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100">
      <div className="loading flex">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 mx-1 bg-gray-400 rounded-full opacity-0"
            style={{
              animation: `ball-fall 1s ease-in-out infinite`,
              animationDelay: `${index * -0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .loading {
          display: flex;
          align-items: flex-end;
        }

        @keyframes ball-fall {
          0% {
            opacity: 0;
            transform: translateY(-145%);
          }
          10% {
            opacity: 0.5;
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translateY(145%);
          }
        }
      `}</style>
    </div>
  );
};

export default FlowChartSkeleton;
