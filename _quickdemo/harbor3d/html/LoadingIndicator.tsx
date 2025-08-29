const LoadingIndicator = ({ progress }) => {
  const circumference = 2 * Math.PI * 45; // Circle radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg className="w-24 h-24" viewBox="0 0 100 100">
      <circle
        className="stroke-gray-300"
        cx="50"
        cy="50"
        r="45"
        fill="none"
        strokeWidth="10"
      />
      <circle
        className="stroke-blue-300"
        cx="50"
        cy="50"
        r="45"
        fill="none"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dy=".3em"
        stroke="#fff"
        className="text-xl font-semibold"
      >
        {`${Math.round(progress)}%`}
      </text>
    </svg>
  );
};

export default LoadingIndicator;
