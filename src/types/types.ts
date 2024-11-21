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
  OfficialLocationName: string;
  CountryCode: string;
}

export type DelayType = 'small' | 'medium' | 'severe' | 'all'; 