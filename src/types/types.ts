export interface TrainAnnouncement {
  AdvertisedTimeAtLocation: string;
  EstimatedTimeAtLocation?: string;
  ProductInformation: {
    Code: string;
    Description: string;
  }[];
  FromLocation: { LocationName: string }[];
  ToLocation: { LocationName: string }[];
}

export interface DelayInfo {
  hours: number;
  minutes: number;
  advertised: Date;
  estimated: Date;
}

export interface TrainStation {
  LocationSignature: string;
  AdvertisedLocationName: string;
  CountryCode: string;
}

export interface StationData {
  LocationSignature: string;
  OfficialLocationName: string;
}

export type DelayType = 'small' | 'medium' | 'severe' | 'all'; 