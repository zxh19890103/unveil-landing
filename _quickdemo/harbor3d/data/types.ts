export interface ShipmentOrder {
  _details: ShipmentOrderDetail[];
  orderIds: string;
  shipmentDate: string;
  originOrder: string;
  startPlace: string;
  destination: string;
  distanceKM: number;
  weight: number;
  containerNumber: string;
  goodType: string;
  status: string;
  lastModificationTime: string | null;
  lastModifierId: string | null;
  creationTime: string;
  creatorId: string | null;
  id: number;
}

export interface ShipmentCar {
  id: number;
  tel: string;
  driver: string;
  carType: string;
  carNumber: string;
}

export interface ShipmentOrderDetail {
  _order: ShipmentOrder;
  shipOrderId: number;
  idx: number;
  carId: number;
  goodMaterialID: number;
  shortName: string;
  count: number;
  price: number;
  amount: number;
  containerNumber: string;
  carNumber: string;
  driverName: string;
  lastModificationTime: string | null;
  lastModifierId: string | null;
  creationTime: string;
  creatorId: string | null;
  id: number;
}
