import React, {useEffect, useState, useRef} from 'react';
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import { environment } from '../../../Environments/EnvDev';
import '../../../App.css';

mapboxgl.accessToken = environment.mapbox.accessToken;

const MapboxComponent = () => {
  const mapContainerRef = useRef('map');
  const map = useRef(null);
  //39.277707,-6.812034
  const [lng] = useState(39.277707);
  const [lat] = useState(-6.812034);
  const [zoom] = useState(15);
  const [start_lat, setStartLat] = useState(39.270246);
  const [start_lng, setStartLng] = useState(-6.811863);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [distance, setDistance] = useState(0);
  const [check, setCheck] = useState(true);

  const handleStart = (e) => {
    setStart(e.target.value)
  }

  const handleEnd = (e) => {
    setEnd(e.target.value)
  }

  const handleStartEnter = (e) => {
    const start_coords = start.split(',');
    setStartLat(start_coords[0]);
    setStartLng(start_coords[1]);

    getRoute([start_lat,start_lng])

    if (map.current.getLayer('point')) {
      map.current.getSource('point').setData([start_lat,start_lng]);
    } else {
      map.current.addLayer({
        id: 'point',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [start_lat,start_lng]
                }
              }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be'
        }
      });
    }
  }

  const handleEndEnter = (e) => {
    const end_coords = end.split(',');
    setEndCords([end_coords[0],end_coords[1]]);
  }

  function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  }

  function handleSubmit(e) {
    // Prevent the browser from reloading the page
    e.preventDefault();
    const start_coords = start.split(',');
    const end_coords = end.split(',');
    setStartLat(start_coords[0]);
    setStartLng(start_coords[1]);
    setEndCords([end_coords[0],end_coords[1]]);
  }

  function handleClear(e) {
    // Prevent the browser from reloading the page
    e.preventDefault();
    map.current.removeLayer('point');
    map.current.removeLayer('end');
    map.current.removeLayer('route');
    map.current.removeSource('point');
    map.current.removeSource('end');
    map.current.removeSource('route');
    setStart('');
    setEnd('');
    setDistance(0);
    setCheck(!check);
  }

  function loadMap(coords){
      getRoute(coords);

      // Add starting point to the map
      if (map.current.getLayer('point')) {
        map.current.getSource('point').setData(coords);
      } else {
        map.current.addLayer({
          id: 'point',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: coords
                  }
                }
              ]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#3887be'
          }
        });
      }
  }

  function setEndCords(coords){
    const end = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        }
      ]
    };
    if (map.current.getLayer('end')) {
      map.current.getSource('end').setData(end);
    } else {
      map.current.addLayer({
        id: 'end',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: coords
                }
              }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#f30'
        }
      });
    }
    getRoute(coords);
  }

  async function getRoute(end) {
    // make a directions request using cycling profile
    // an arbitrary start will always be the same
    // only the end or destination will change
    console.log(end);
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${start_lat},${start_lng};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    console.log(data);
    const route = data.geometry.coordinates;
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route
      }
    };
    setDistance(data.distance);
    // if the route already exists on the map, we'll reset it using setData
    if (map.current.getSource('route')) {
      map.current.getSource('route').setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
    }
  }

  // Initialize map when component mounts
  useEffect(() => {

    map.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    });

    // Add our navigation control (the +/- zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // create a function to make a directions request
    // add turn instructions here at the end
    
    map.current.on('load', () => {
      // make an initial directions request that
      // starts and ends at the same location
      loadMap([start_lat,start_lng]);
      // this is where the code from the next step will go
    });

    map.current.on('click', (event) => {
      const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
      check ? setEndCords(coords) : loadMap(coords);
    });
    // Clean up on unmount
    return () => map.current.remove();
  }, [lat, lng, zoom]); 

  return (
    <div>
      <label>
        Co-ordinates 1:
        <input name="start" onChange={(e)=>handleStart(e)} value={start} onKeyPress={handleStartEnter}/>
      </label>
      <hr />
      <label>
        Co-ordinates 2:
        <input name="end" onChange={(e)=>handleEnd(e)} value={end} onKeyPress={handleEndEnter}/>
      </label>
      <hr />
      <button type="submit" onClick={handleSubmit}>Calculate</button>
      &nbsp;
      <button type="submit" onClick={handleClear}>Clear</button>
      <hr />
      <label>Distance: {roundToTwo(distance/1000)} km</label>
      <hr />
      <div className='map-container' ref={mapContainerRef} />
    </div>
  );
};

export default MapboxComponent;
