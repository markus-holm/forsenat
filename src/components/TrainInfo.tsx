import { useState, useEffect, useRef } from "react";
import { TrainAnnouncement, DelayType, TrainStation } from "../types/types";
import DelayDisplay from "./DelayDisplay";
import { TrainService } from "../services/TrainService";

const TrainInfo: React.FC = () => {
  const [stationCode, setStationCode] = useState("");
  const [announcements, setAnnouncements] = useState<TrainAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stationName, setStationName] = useState<string>("");
  const [fromToStations, setFromToStations] = useState<Record<string, string>>(
    {}
  );
  const [selectedDelayType, setSelectedDelayType] = useState<DelayType>("all");
  const [suggestions, setSuggestions] = useState<TrainStation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length >= 2) {
      const cachedStations = localStorage.getItem("allTrainStations");
      if (cachedStations) {
        const stations: TrainStation[] = JSON.parse(cachedStations);
        const filtered = stations
          .filter((station) =>
            station.OfficialLocationName.toLowerCase().includes(
              value.toLowerCase()
            )
          )
          .sort((a, b) =>
            a.OfficialLocationName.localeCompare(b.OfficialLocationName, "sv")
          )
          .slice(0, 10);

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleStationSelect = (station: TrainStation) => {
    setInputValue(station.OfficialLocationName);
    setStationCode(station.LocationSignature);
    setShowSuggestions(false);
  };

  const loadStationName = async (locationCode: string) => {
    const name = await TrainService.getStationName(locationCode);
    setFromToStations((prev) => ({
      ...prev,
      [locationCode]: name,
    }));
    return name;
  };

  const getDelayMinutes = (announcement: TrainAnnouncement): number => {
    const advertised = new Date(announcement.AdvertisedTimeAtLocation);
    const estimated = announcement.EstimatedTimeAtLocation;

    if (!estimated) return 0;

    const estimatedDate = new Date(estimated);
    return Math.floor(
      (estimatedDate.getTime() - advertised.getTime()) / (1000 * 60)
    );
  };

  const filterByDelayType = (
    announcements: TrainAnnouncement[]
  ): TrainAnnouncement[] => {
    if (selectedDelayType === "all") return announcements;

    return announcements.filter((announcement) => {
      const delayMinutes = getDelayMinutes(announcement);
      switch (selectedDelayType) {
        case "small":
          return delayMinutes > 0 && delayMinutes <= 5;
        case "medium":
          return delayMinutes > 5 && delayMinutes < 20;
        case "severe":
          return delayMinutes >= 20;
        default:
          return true;
      }
    });
  };

  const getLocationSignature = (input: string): string | null => {
    const cachedStations = localStorage.getItem("allTrainStations");
    if (cachedStations) {
      const stations: TrainStation[] = JSON.parse(cachedStations);
      const station = stations.find(
        (s) =>
          s.OfficialLocationName.toLowerCase() === input.toLowerCase() ||
          s.LocationSignature.toLowerCase() === input.toLowerCase()
      );
      return station?.LocationSignature || null;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFromToStations({});

    try {
      // Try to get LocationSignature from input
      const locationSignature = getLocationSignature(stationCode);

      if (!locationSignature) {
        throw new Error("Invalid station name or code");
      }

      const name = await TrainService.getStationName(locationSignature);
      setStationName(name);

      const data = await TrainService.getTrainAnnouncements(locationSignature);

      // Pre-load all station names
      const stationCodes = new Set<string>();
      data.forEach((announcement) => {
        announcement.FromLocation.forEach((loc) =>
          stationCodes.add(loc.LocationName)
        );
        announcement.ToLocation.forEach((loc) =>
          stationCodes.add(loc.LocationName)
        );
      });

      await Promise.all(Array.from(stationCodes).map(loadStationName));

      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateDelayInfo = (announcement: TrainAnnouncement) => {
    const advertised = new Date(announcement.AdvertisedTimeAtLocation);
    const estimated = announcement.EstimatedTimeAtLocation;

    if (!estimated || estimated === announcement.AdvertisedTimeAtLocation) {
      return null;
    }

    const estimatedDate = new Date(estimated);
    const diffInMilliseconds = estimatedDate.getTime() - advertised.getTime();
    const diffInMinutes = diffInMilliseconds / (1000 * 60);

    return {
      hours: Math.floor(diffInMinutes / 60),
      minutes: Math.floor(diffInMinutes % 60),
      advertised,
      estimated: estimatedDate,
    };
  };

  const getDelayCount = (delayType: DelayType): number => {
    return announcements.filter((announcement) => {
      const delayMinutes = getDelayMinutes(announcement);
      switch (delayType) {
        case "small":
          return delayMinutes > 0 && delayMinutes <= 5;
        case "medium":
          return delayMinutes > 5 && delayMinutes < 20;
        case "severe":
          return delayMinutes >= 20;
        case "all":
          return delayMinutes > 0;
        default:
          return false;
      }
    }).length;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter station name"
              className="w-full p-2 border rounded"
              required
            />
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {suggestions.map((station) => (
                  <div
                    key={station.LocationSignature}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleStationSelect(station)}
                  >
                    <span className="font-medium">
                      {station.OfficialLocationName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Check Delays"}
          </button>
        </div>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {stationName && announcements.length > 0 && (
        <>
          <div className="mb-4 text-lg font-semibold">
            Station: {stationName}
          </div>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDelayType("all")}
              className={`px-3 py-1 rounded flex items-center gap-2 ${
                selectedDelayType === "all"
                  ? "bg-neutral-500 text-white"
                  : "bg-neutral-300 hover:bg-neutral-500 hover:text-white"
              }`}
            >
              <span>All Delays</span>
              <span className="px-2 py-0.5 rounded-full text-sm text-white bg-cyan-500">
                {getDelayCount("all")}
              </span>
            </button>
            <button
              onClick={() => setSelectedDelayType("small")}
              className={`px-3 py-1 rounded flex items-center gap-2 ${
                selectedDelayType === "small"
                  ? "bg-neutral-500 text-white"
                  : "bg-neutral-300 hover:bg-neutral-500 hover:text-white"
              }`}
            >
              <span>Small (≤5min)</span>
              <span className="px-2 py-0.5 rounded-full text-sm text-white bg-blue-500">
                {getDelayCount("small")}
              </span>
            </button>
            <button
              onClick={() => setSelectedDelayType("medium")}
              className={`px-3 py-1 rounded flex items-center gap-2 ${
                selectedDelayType === "medium"
                  ? "bg-neutral-500 text-white"
                  : "bg-neutral-300 hover:bg-neutral-500 hover:text-white"
              }`}
            >
              <span>Medium (6-19min)</span>
              <span className="px-2 py-0.5 rounded-full text-sm text-white bg-yellow-500">
                {getDelayCount("medium")}
              </span>
            </button>
            <button
              onClick={() => setSelectedDelayType("severe")}
              className={`px-3 py-1 rounded flex items-center gap-2 ${
                selectedDelayType === "severe"
                  ? "bg-neutral-500 text-white"
                  : "bg-neutral-300 hover:bg-neutral-500 hover:text-white"
              }`}
            >
              <span>Severe (≥20min)</span>
              <span className="px-2 py-0.5 rounded-full text-sm text-white bg-red-500">
                {getDelayCount("severe")}
              </span>
            </button>
          </div>
        </>
      )}

      {stationName && announcements.length === 0 && (
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold mb-2">
            Station: {stationName}
          </div>
          <div className="text-gray-600">No delays found for this station</div>
        </div>
      )}

      {filterByDelayType(announcements).map((announcement, index) => (
        <div key={index} className="bg-white p-4 rounded shadow-md mb-4">
          {announcement.ProductInformation.map((info, i) => (
            <p key={i} className="font-bold">
              Train: {info.Description}
            </p>
          ))}
          <p>
            From:{" "}
            {fromToStations[announcement.FromLocation[0]?.LocationName] ||
              "Loading..."}
          </p>
          <p>
            To:{" "}
            {fromToStations[announcement.ToLocation[0]?.LocationName] ||
              "Loading..."}
          </p>
          {calculateDelayInfo(announcement) && (
            <DelayDisplay delayInfo={calculateDelayInfo(announcement)!} />
          )}
        </div>
      ))}
    </div>
  );
};

export default TrainInfo;
