'use client';
import * as React from 'react';
import { useGeolocated } from "react-geolocated";
import Map, { Marker } from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Home() {  
  const { coords, isGeolocationAvailable, isGeolocationEnabled } =
  useGeolocated({
      positionOptions: {
          enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
  });

  if (!isGeolocationAvailable) {
    return <div>Your browser does not support Geolocation</div>;
  }

  if (!isGeolocationEnabled) {
    return <div>Geolocation is not enabled</div>;
  }

  if (!coords) {
    return <div>Fetching location...</div>;
  }


  return (
    <div style={{ width: '100vw', height: '80vh'}}>
      <Map
        initialViewState={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          zoom: 12
        }}
        style={{ width: '100%', height: '100%' }} 
        mapStyle="mapbox://styles/mapbox/streets-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false} //to limit api calls 
      >
        <Marker latitude={coords.latitude} longitude={coords.longitude}>
          <div style={{ fontSize: '24px'}}>📍</div>
        </Marker>

      
      </Map>
    </div>

  );
}
 // Getting flight data array
const fetchData = async () => {
  const longitude = viewport?.longitude;
  const latitude = viewport?.latitude;
  const radius = 500; // radius in nautical miles
  const url = `https://opensky-network.org/api/states/all?lamin=${
    latitude - radius / 60
  }&lomin=${longitude - radius / 60}&lamax=${latitude + radius / 60}&lomax=${
    longitude + radius / 60
  }&time=0`;

  setFlightUrl(url);
  try {
    const response = await fetch(url);
    const data = await response.json();

    setFlights(data.states);
    console.log(
      "Fetch function ran succesfully for coords",
      longitude,
      latitude,
      "and fetch url",
      url
    );
  } catch (error) {
    console.error("error", error.message);
  }
};