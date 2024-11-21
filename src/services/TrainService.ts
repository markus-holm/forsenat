import { TrainAnnouncement, TrainStation, StationData } from '../types/types';

export class TrainService {
  private static readonly API_URL = '/api/trafikverket/data.json';
  private static readonly AUTH_KEY = '0140fbc597b048eabedbee772ccedd9d';
  private static readonly STATION_CACHE_KEY = 'trainStationCache';
  private static readonly ALL_STATIONS_KEY = 'allTrainStations';
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) return;

    const cachedStations = localStorage.getItem(this.ALL_STATIONS_KEY);
    if (!cachedStations) {
      await this.fetchAndCacheAllStations();
    }
    this.initialized = true;
  }

  private static async fetchAndCacheAllStations(): Promise<void> {
    const xmlRequest = `
      <REQUEST>
        <LOGIN authenticationkey="${this.AUTH_KEY}" />
        <QUERY objecttype="TrainStation" schemaversion="1.4">
          <FILTER>
            <EQ name='CountryCode' value='SE' />
            <IN name="CountyNo" value="1, 2, 3, 4" />
          </FILTER>
          <INCLUDE>OfficialLocationName</INCLUDE>
          <INCLUDE>LocationSignature</INCLUDE>
        </QUERY>
      </REQUEST>
    `;

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'application/json',
        },
        body: xmlRequest,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const stations = data?.RESPONSE?.RESULT?.[0]?.TrainStation || [];
      
      const stationData: StationData[] = stations.map((station: StationData) => ({
        LocationSignature: station.LocationSignature,
        OfficialLocationName: station.OfficialLocationName,
      }));

      localStorage.setItem(this.ALL_STATIONS_KEY, JSON.stringify(stationData));
      console.log('All stations cached successfully');
    } catch (error) {
      console.error('Error fetching all stations:', error);
      throw error;
    }
  }

  public static async getTrainStation(stationCode: string): Promise<TrainStation | null> {
    await this.initialize();

    // First check the cache
    const cachedStations = localStorage.getItem(this.ALL_STATIONS_KEY);
    if (cachedStations) {
      const stations: StationData[] = JSON.parse(cachedStations);
      const station = stations.find(s => s.LocationSignature === stationCode);
      
      if (station) {
        return {
          LocationSignature: station.LocationSignature,
          AdvertisedLocationName: station.OfficialLocationName,
          CountryCode: 'SE'
        };
      }
    }

    return null;
  }

  public static async getTrainAnnouncements(stationCode: string): Promise<TrainAnnouncement[]> {
    const xmlRequest = `
      <REQUEST>
        <LOGIN authenticationkey="${this.AUTH_KEY}" />
        <QUERY objecttype="TrainAnnouncement" schemaversion="1.9" limit="30">
          <FILTER>
            <EQ name='LocationSignature' value='${stationCode}' />
            <EQ name="ActivityType" value="Avgang" />
            <AND>
              <GTE name='AdvertisedTimeAtLocation' value='$dateadd(-0.00:15:00)' />
            </AND>
          </FILTER>
        </QUERY>
      </REQUEST>
    `;

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'application/json',
        },
        body: xmlRequest,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const announcements = data?.RESPONSE?.RESULT?.[0]?.TrainAnnouncement || [];
      
      // Filter out announcements with no delay or negative delay
      return announcements.filter((announcement: TrainAnnouncement) => {
        const delayInMinutes = this.calculateDelay(announcement);
        return delayInMinutes > 0;
      });
    } catch (error) {
      console.error('Error fetching train announcements:', error);
      throw new Error('Failed to fetch train announcements');
    }
  }

  public static async getStationName(stationCode: string): Promise<string> {
    try {
      const station = await this.getTrainStation(stationCode);
      return station?.AdvertisedLocationName || stationCode;
    } catch (error) {
      console.error('Error getting station name:', error);
      return stationCode;
    }
  }

  private static calculateDelay(announcement: TrainAnnouncement): number {
    const advertised = new Date(announcement.AdvertisedTimeAtLocation);
    const estimated = announcement.EstimatedTimeAtLocation;
    
    if (!estimated) return 0;
    
    const estimatedDate = new Date(estimated);
    return Math.floor((estimatedDate.getTime() - advertised.getTime()) / (1000 * 60)); // Returns delay in minutes
  }
} 