export type Device = {
    id: string;
    serialNumber: string;
    type: {
      id: string;
      name: string;
    };
    ownerIns: {
      id: string;
      name: string;
    };
    owner: {
      id: string;
      userName: string;
    };
    providerIns: {
      id: string;
      name: string;
    };
    provider: {
      id: string;
      userName: string;
    };
    typeId: string;
  };
  
  export type NotificationType = {
    id: string;
    name: string;
  };
  
  export type User = {
    id: string;
    name: string;
  };
  
  export type Institution = {
    id: string;
    name: string;
  };