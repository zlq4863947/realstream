export interface PubNub {
  grant: (opt: any, callbank: (status: ErrorStatus) => void | string) => void;
  setAuthKey: (key: string) => void;
  publish: (opt: any, callbank: (status: ErrorStatus) => void | string) => void;
  addListener: (opt: any) => void;
  subscribe: (opt: any) => void;
}

export interface ErrorStatus {
  error: boolean;
  type: string;
}

export interface StatusAnnouncement {
  error: boolean,
  statusCode: number,
  category: string,
  errorData: Object,
  lastTimetoken: number,
  currentTimetoken: number,
  // send back channel, channel groups that were affected by this operation
  affectedChannels: Array<String>,
  affectedChannelGroups: Array<String>,
}

export interface MessageAnnouncement {
  message: Object,
  subscribedChannel: string, // deprecated
  actualChannel: string,     // deprecated
  channel: string,
  subscription: string,
  timetoken: number | string,
  userMetadata: Object,
  publisher: string
}

export interface PriNubOptions {
  publishKey: string;
  subscribeKey: string;
  secretKey: string;
  salt: string;
  ttl?: number;
}

export interface PubNubOptions {
  publishKey: string;
  subscribeKey: string;
}

export interface GrantOptions {
  pubnub: PubNub;
  channel: string | string[];
  key: string | string[];
  write: boolean;
  read: boolean;
  ttl?: number;
}
