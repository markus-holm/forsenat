import { DelayInfo } from "../types/types";

interface DelayDisplayProps {
  delayInfo: DelayInfo;
}

const DelayDisplay: React.FC<DelayDisplayProps> = ({ delayInfo }) => {
  const { hours, minutes, advertised, estimated } = delayInfo;
  const totalMinutes = hours * 60 + minutes;
  const delayText =
    hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`;

  const getDelayColor = () => {
    if (totalMinutes <= 5) return "text-blue-500";
    if (totalMinutes < 20) return "text-yellow-500";
    return "text-red-500 animate-pulse";
  };

  return (
    <div className="space-y-2">
      <p>Advertised time: {advertised.toLocaleString()}</p>
      <p>Estimated time: {estimated.toLocaleString()}</p>
      <p className={`font-bold ${getDelayColor()}`}>Delay: {delayText}</p>
    </div>
  );
};

export default DelayDisplay;
