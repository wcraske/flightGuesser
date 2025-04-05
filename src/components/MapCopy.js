'use client';
import * as React from 'react';
import { useGeolocated } from "react-geolocated";
import Map, { Marker } from 'react-map-gl/mapbox';
import { IoMdAirplane } from "react-icons/io";
import { FaMapMarkerAlt } from "react-icons/fa";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const AVIATIONSTACK_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY;

//gets location of user
export default function Home() {
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: false },
    userDecisionTimeout: 5000,
  });


  // State variables
  const [flights, setFlights] = React.useState([]);
  const [selectedFlight, setSelectedFlight] = React.useState(null);
  const [clicked, setClicked] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const popupRef = React.useRef(null);



  //gets data from aviationstack
const fetchDataA = async () => {
  if (!AVIATIONSTACK_KEY) {
    console.error("Missing AviationStack API key");
    return;
  }

  if (!coords) {
    console.warn("Coordinates not available");
    return;
  }

  const RADIUS_KM = 1000; 

  //function to calculate distance using Haversine formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&flight_status=active&limit=100`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.data) {
      console.error("No data returned from AviationStack");
      return;
    }

    const nearbyFlights = data.data.filter(flight => {
      const lat = flight?.live?.latitude;
      const lon = flight?.live?.longitude;
      if (lat == null || lon == null) return false;

      const distance = getDistanceFromLatLonInKm(coords.latitude, coords.longitude, lat, lon);
      return distance <= RADIUS_KM;
    });

    setFlights(nearbyFlights);
  } catch (error) {
    console.error("Error fetching AviationStack data:", error.message);
  }
};


  //gets data from opensky
  /*
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
*/



  
  React.useEffect(() => {
    if (coords) {
      fetchDataA();
    }
  }, [coords]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setClosing(true);
      }
    };

    if (clicked && !closing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clicked, closing]);



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
        maxPitch={0}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        maxBounds={[[coords.longitude - 0.2, coords.latitude - 0.06], [coords.longitude + 0.2, coords.latitude + 0.06]]}
      >
        {/* User location */}
        <Marker latitude={coords.latitude} longitude={coords.longitude}>
          <FaMapMarkerAlt className="text-yellow-300 text-[24px] drop-shadow-[0_0_4px_black]" />
        </Marker>

        {/* Flights */}
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

      {/* Flight Info Popup */}
      {clicked && selectedFlight && (
        <div
          ref={popupRef}
          className={`fixed bottom-0 left-0 w-full bg-white shadow-xl p-4 border-t border-gray-300 z-50 text-black rounded-t-xl ${
            closing ? "animate-slide-down" : "animate-slide-up"
          }`}
          onAnimationEnd={() => {
            if (closing) {
              setClicked(false);
              setSelectedFlight(null);
              setClosing(false);
            }
          }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Flight Info</h2>
              <p><strong>Callsign:</strong> {selectedFlight[1] || 'N/A'}</p>
              <p><strong>Origin Country:</strong> {selectedFlight[2] || 'N/A'}</p>
              <p><strong>Altitude:</strong> {selectedFlight[13] ? `${Math.round(selectedFlight[13])} m` : 'N/A'}</p>
              <p><strong>Velocity:</strong> {selectedFlight[9] ? `${Math.round(selectedFlight[9])} m/s` : 'N/A'}</p>
              <p><strong>Heading:</strong> {selectedFlight[10] ? `${Math.round(selectedFlight[10])}°` : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
