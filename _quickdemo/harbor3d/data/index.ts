import type {
  ShipmentCar,
  ShipmentOrder,
  ShipmentOrderDetail,
} from "./types.js";

export const NAME_2_ROAD = {
  双D港: 5,
  开发区物流中心: 6,
};

const delay = () => {
  return new Promise<true>((done) => {
    setTimeout(() => {
      done(true);
    }, 10);
  });
};

const isLocal = window.location.host === "localhost:4002";

console.log('isLocal', isLocal);

const backendBaseUrl = isLocal
  ? "http://localhost:4002/quickdemo/harbor3d/@mockdat"
  : "http://localhost:44343/api/app";

export const loadCars = async () => {
  await delay();
  const cars = await fetch(
    isLocal
      ? `${backendBaseUrl}/cars.json`
      : `${backendBaseUrl}/car/avaiable-list`
  ).then((r) => r.json());
  return cars as ShipmentCar[];
};

export const loadShipmentOrders = async () => {
  await delay();

  const orders = await fetch(
    isLocal
      ? `${backendBaseUrl}/shipment-orders.json`
      : `${backendBaseUrl}/ship-order`
  ).then((r) => r.json());

  return orders.items as ShipmentOrder[];
};

export const loadShipmentOrderDetail = async (orderId: number) => {
  await delay();

  const details = await fetch(
    isLocal ?
    `${backendBaseUrl}/order-details.json`: 
    `${backendBaseUrl}/ship-order/order-detail?ShipOrderId=${orderId}`
  ).then(
    (r) => r.json()
  );

  return details as ShipmentOrderDetail[];
};
