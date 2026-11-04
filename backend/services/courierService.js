/*
=====================================
COURIER SERVICE (manual today, API-ready tomorrow)
=====================================
The courier is DPD, but it is used MANUALLY: the admin selects DPD and types
in the tracking number / URL by hand. There are NO API calls here, no
automatic tracking numbers and no automatic tracking updates.

When a real integration is approved (DPD), add a provider
file (e.g. services/couriers/dpdProvider.js) that implements the methods in
`ManualProvider` below, then register it with `registerProvider()`. The rest
of the app (orderController, admin UI) already talks to couriers only through
this file, so it won't need to change.

API credentials must come from environment variables (process.env.*) — never
hardcode them in source.
*/

// The client ships with DPD only. `value` is what's stored in
// orders.courier_name. Add more entries here if another courier is ever used.
const DEFAULT_COURIER = "DPD";

const COURIER_OPTIONS = [
    { value: "DPD", label: "DPD" }
];

const VALID_COURIERS = new Set(COURIER_OPTIONS.map((c) => c.value));

/*
Provider contract. Every future provider should expose the same shape:

  {
    name: "DPD",
    supportsApi: true,
    createShipment(order)      -> { trackingNumber, trackingUrl, labelUrl? }
    getLabel(order)            -> Buffer | url
    getTrackingStatus(order)   -> { status, events[] }
  }

The manual provider supports none of them and says so explicitly.
*/
// DPD API access (credentials for shipment creation / labels / tracking) has
// NOT been confirmed for this client, so nothing below talks to DPD. Labels
// are uploaded manually from the DPD portal (see deliveryController) and the
// admin types tracking numbers by hand.
const ManualProvider = {
    name: "Manual",
    supportsApi: false,
    async createShipment() {
        throw new Error("Automatic shipment creation is not configured. Enter tracking details manually.");
    },
    async getLabel() {
        throw new Error("Shipping label generation is not configured.");
    },
    async getTrackingStatus() {
        throw new Error("Automatic tracking sync is not configured.");
    }
};

const providers = {};

function registerProvider(courierName, provider) {
    providers[courierName] = provider;
}

function getProvider(courierName) {
    return providers[courierName] || ManualProvider;
}

function isValidCourier(name) {
    return VALID_COURIERS.has(name);
}

module.exports = {
    DEFAULT_COURIER,
    COURIER_OPTIONS,
    isValidCourier,
    registerProvider,
    getProvider
};
