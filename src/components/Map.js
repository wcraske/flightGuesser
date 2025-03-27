'use client';
import * as React from 'react';
import { useGeolocated } from "react-geolocated";
import Map, { Marker } from 'react-map-gl/mapbox';
import { IoMdAirplane } from "react-icons/io";
import { FaMapMarkerAlt } from "react-icons/fa";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;



export default function Home() {  
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: false },
    userDecisionTimeout: 5000,
  });


  const [flights, setFlights] = React.useState([]);
  const [selectedFlight, setSelectedFlight] = React.useState(null);
  const [clicked, setClicked] = React.useState(false);



  // Fetch flight data
  const fetchData = async () => {
    if (!coords) return;
    
    const longitude = coords.longitude;
    const latitude = coords.latitude;
    const radius = 500; // radius in nautical miles
    const url = `https://opensky-network.org/api/states/all?lamin=${
      latitude - radius / 60
    }&lomin=${longitude - radius / 60}&lamax=${latitude + radius / 60}&lomax=${
      longitude + radius / 60
    }&time=0`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setFlights(data.states || []);
      console.log("Fetched flight data successfully", data.states);
    } catch (error) {
      console.error("Error fetching flight data:", error.message);
    }
  };



  React.useEffect(() => {
    if (coords) {
      fetchData();
    }
  }, [coords]);

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
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialViewState={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          zoom: 12
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false}//limit api calls
      >
       {/* User's current location */}
       <Marker latitude={coords.latitude} longitude={coords.longitude}>
       <FaMapMarkerAlt className="text-yellow-300 text-[24px] drop-shadow-[0_0_4px_black]" />
       </Marker>


        {/* Render planes */}
        {flights.map((flight) => (
          <Marker key={flight[0]} longitude={flight[5]} latitude={flight[6]}>
            <IoMdAirplane
              onClick={() => {
                setSelectedFlight(flight);
                setClicked(true);
              }}
              style={{ transform: `rotate(${flight[10]}deg)` }}
              className={selectedFlight === flight ? "text-red-600 text-[38px] cursor-pointer" : "text-yellow-600 text-[32px] cursor-pointer"}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
