const https = require("https");

const validateCoordinates = (location, label = "Location") => {
  if (!location || typeof location !== "object") {
    throw new Error(`${label} is required`);
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`${label} must contain valid latitude and longitude numbers`);
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error(`${label} latitude must be between -90 and 90`);
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(`${label} longitude must be between -180 and 180`);
  }

  return { latitude, longitude };
};

const getGoogleApiKey = () => {
  const apiKey = process.env.GOOGLE_MAP_API;

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    const error = new Error("Google Maps API key is not configured");
    error.code = "GOOGLE_MAPS_CONFIG_ERROR";
    throw error;
  }

  return apiKey.trim();
};

const googleRequest = async (url) => {
  const apiKey = getGoogleApiKey();

  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      const chunks = [];

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const rawResponse = Buffer.concat(chunks).toString("utf8");

        if (!rawResponse) {
          reject(new Error("Empty Google Maps response"));
          return;
        }

        try {
          const parsed = JSON.parse(rawResponse);

          if (response.statusCode >= 400) {
            reject(new Error(parsed?.error_message || "Google Maps request failed"));
            return;
          }

          if (parsed?.status && ["REQUEST_DENIED", "INVALID_REQUEST", "OVER_QUERY_LIMIT", "ZERO_RESULTS"].includes(parsed.status)) {
            reject(new Error(parsed.error_message || parsed.status || "Google Maps request failed"));
            return;
          }

          resolve(parsed);
        } catch (error) {
          reject(new Error("Invalid Google Maps response"));
        }
      });
    });

    request.on("error", (error) => reject(error));
    request.setTimeout(15000, () => {
      request.destroy(new Error("Google Maps request timed out"));
    });
  });
};

const normalizeDistance = (meters) => {
  const safeMeters = Number(meters) || 0;

  return {
    meters: safeMeters,
    kilometers: Number((safeMeters / 1000).toFixed(2)),
  };
};

const normalizeDuration = (seconds) => {
  const safeSeconds = Number(seconds) || 0;

  return {
    seconds: safeSeconds,
    minutes: Number((safeSeconds / 60).toFixed(2)),
  };
};

const calculateDistanceAndDuration = async (origin, destination) => {
  const validatedOrigin = validateCoordinates(origin, "Origin");
  const validatedDestination = validateCoordinates(destination, "Destination");
  const apiKey = getGoogleApiKey();

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${validatedOrigin.latitude},${validatedOrigin.longitude}&destinations=${validatedDestination.latitude},${validatedDestination.longitude}&key=${apiKey}`;
  const data = await googleRequest(url);
  const element = data?.rows?.[0]?.elements?.[0];

  if (!element || element.status === "ZERO_RESULTS") {
    throw new Error("No route found between the provided locations");
  }

  return {
    distance: normalizeDistance(element.distance?.value),
    duration: normalizeDuration(element.duration?.value),
  };
};

const calculateRoute = async (origin, destination) => {
  const validatedOrigin = validateCoordinates(origin, "Origin");
  const validatedDestination = validateCoordinates(destination, "Destination");
  const apiKey = getGoogleApiKey();

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${validatedOrigin.latitude},${validatedOrigin.longitude}&destination=${validatedDestination.latitude},${validatedDestination.longitude}&key=${apiKey}`;
  const data = await googleRequest(url);
  const route = data?.routes?.[0];

  if (!route) {
    throw new Error("No route found between the provided locations");
  }

  const leg = route.legs?.[0];
  const totalDistance = leg?.distance?.value || 0;
  const totalDuration = leg?.duration?.value || 0;

  return {
    distance: normalizeDistance(totalDistance),
    duration: normalizeDuration(totalDuration),
    route: {
      encodedPolyline: route.overview_polyline?.points || null,
    },
  };
};

const getCaptainToShopRoute = async (captainLocation, shopLocation) => {
  return calculateRoute(captainLocation, shopLocation);
};

const getCaptainToCustomerRoute = async (captainLocation, customerLocation) => {
  return calculateRoute(captainLocation, customerLocation);
};

const getShopToCustomerRoute = async (shopLocation, customerLocation) => {
  return calculateRoute(shopLocation, customerLocation);
};

module.exports = {
  validateCoordinates,
  calculateDistanceAndDuration,
  calculateRoute,
  getCaptainToShopRoute,
  getCaptainToCustomerRoute,
  getShopToCustomerRoute,
};
