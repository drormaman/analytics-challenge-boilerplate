import React,{useEffect, useState} from "react";
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../../machines/authMachine";
import styled from 'styled-components'
import { GoogleMap, LoadScript, Marker , MarkerClusterer} from '@react-google-maps/api';
import {Event, Location} from '../../models/event'


export interface Props {
  authService: Interpreter<AuthMachineContext, any, AuthMachineEvents, any>;
}

const containerStyle = {
    width: '100%',
    height: '400px'
  };
   
  const center = {
    lat: -3.745,
    lng: -38.523
  };
   
  const options = {
    imagePath:
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', // so you must have m1.png, m2.png, m3.png, m4.png, m5.png and m6.png in that folder
  }
  
//   function createKey(location : Location) {
//     return location.lat * location.lng
//   }
  

const EventMap: React.FC = () => {

    const [events, setEvents] = useState([])
 
    useEffect(() => {
        fetchEvents();
    }, [])
    async function fetchEvents() {
        const response = await fetch("http://localhost:3001/events/all")
        console.log(response)
        const data = await response.json()
        setEvents(data)
    }

    return (
      <LoadScript
        googleMapsApiKey="AIzaSyBHT4RJMjW12nkv1XBIKhFH_5FcSUqkeDQ"
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={2}
        //   onLoad={onLoad}
        //   onUnmount={onUnmount}
        >
            <MarkerClusterer options={options}>
                
            {(clusterer) => 
                events.map((event:Event , i: number)=> {
                    return (<Marker key={i} position={event.geolocation.location}
                    clusterer={clusterer} /> )
                })
            }
            
            </MarkerClusterer>
        </GoogleMap>
      </LoadScript>
    )
  
};

export default EventMap;
