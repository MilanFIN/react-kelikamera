//TODO: värit kilsakuvauksiin



import React from 'react';
import {
  Alert,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  FlatList,
  Image,
  TextInput,
  TouchableHighlight,
  TouchableOpacity
} from 'react-native';
import { useState , useEffect} from "react";

import openMap from 'react-native-open-maps';

//import Geolocation from '@react-native-community/geolocation';

import RNLocation from 'react-native-location';

//import {Picker} from '@react-native-community/picker';
import {Picker} from  '@react-native-picker/picker';
//import RNPickerSelect from 'react-native-picker-select';


import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

 //';
import { Button, Text } from 'react-native-paper';
import { Item } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';


RNLocation.configure({ 
  distanceFilter: 0,
  //desiredAccuracy: {"android": "lowPower"}

});

const getItemColor = (dist, max) => {
  let percent = dist/max * 100

  let r = 0
  let g = 0
  if (percent < 50) {
    g = 225
    r = 225*percent/100 * 2
  }
  else {
    r = 225
    g = 225 - (225 * (percent-50)/100 *2);
  }
  //255
  //const r = 225 * percent/100;
  //const g = 225 - (225 * percent/100);
  return 'rgb('+r+','+g+',0)';
}


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}



async function getCameraLocations() {
  try {
  let response = await fetch(
  'https://tie.digitraffic.fi/api/v1/metadata/camera-stations',
  );
  let responseJson = await response.json();

  let cameras = []
  responseJson.features.forEach(element => {
    let id = element.properties.id
    let name = element.properties.names.fi
    let mun = element.properties.municipality
    let city = element.properties.municipality
    let y = element.geometry.coordinates[0]
    let x = element.geometry.coordinates[1]
    let distance = 0
    let status = element.properties.collectionStatus
    if (status == "GATHERING") {
      cameras.push({name: name + ", " + mun , id: id, lat: x, lon:y, city:city, distance: distance})

    }
  });


  return cameras;
  } catch (error) {
  console.error(error);
  }
}

async function getCameraData(id:string) {

  try {
    let response = await fetch(
    'https://tie.digitraffic.fi/api/v1/data/camera-data/'+id,
    );
    let responseJson = await response.json();
    let result = []
    console.log(responseJson)
    responseJson.cameraStations[0].cameraPresets.forEach(val => {
      result.push({"label": val.presentationName, value: val.imageUrl})
    });


    return result;
    } catch (error) {
    console.error(error);
    }
  
}



const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedValue, setSelectedValue] = useState("java");
  const [locations, setLocations] = useState([{id: "0", name: "loading", city:"none", distance:0, lat:0, lon:0}])
  const [filteredLocations, setFilteredLocations] = useState([{id: "0", name: "loading", city:"none", distance:0, lat:0, lon:0}])
  const [cameraButtons, setCameraButtons] = useState([{label: "temp", value: ""}])
  const [initialized, setInitialized] = useState(false);
  const [imageUri, setImageUri] = useState("https://i.kym-cdn.com/entries/icons/facebook/000/026/981/0bd0ed742059cd7f4c83882095aeb3752e45dfbfv2_hq.jpg")
  const [filterText, setFilterText] = useState("")
  const [lat, setLat] = useState(0.0)
  const [lon, setLon] = useState(0.0)
  const [sortMode, setSortMode] = useState("distance")
  const [cameraLocation, setCameraLocation] = useState({lat:0, lon:0})
  const [maxDistance, setMaxDistance] = useState(100)
  //ei välttis tarvii, alemmasta saa myös id:t
  //getCameras()



  useEffect(()=> {
    (async () => {
        let cameras =  await getCameraLocations()
        let sortedCameras = []
        const location = await getLocation();
        if (location.length === 2) {
          setLat(location[0])
          setLon(location[1])

          cameras.forEach(l => {
            l.distance = getDistanceFromLatLonInKm(location[0], location[1], l.lat, l.lon)
          })
          sortedCameras = sortByDistance(location[0], location[1], cameras)//sortByDistance(location[0], location[1], cameras)

          setMaxDistance(sortedCameras[sortedCameras.length -1].distance)
        }
        else {
          sortedCameras = sortByCity(cameras)//sortByDistance(location[0], location[1], cameras)

        }
        setLocations(sortedCameras)
        setFilteredLocations(sortedCameras)

        loadInitial(sortedCameras[0].id, sortedCameras[0].lat, sortedCameras[0].lon)

    })()
  }, []);

 const getLocation = async() => {

  let granted = await  RNLocation.requestPermission({
                  ios: "whenInUse",
                  android: {
                    detail: "coarse"
                  }})
    if (granted) {
      //let locationSubscription = RNLocation.subscribeToLocationUpdates(locs => {
      let loc = await RNLocation.getLatestLocation({ timeout: 60000 })
      
      
      let lat1 = loc.latitude
      let lon1 = loc.longitude


      return [lat1, lon1]

    }
    else {
      console.log("no gps")
      Alert.alert("Allow location permissions to sort cameras based on distance to current position")
      return []

    }

    



 }

 const loadInitial = async(id:string, latitude:number, lognitude:number) => {
  //setSelectedValue(itemValue)
  let buttons = await getCameraData(id)
  setCameraLocation({lat: latitude, lon:lognitude})

  setCameraButtons(buttons)

  setImageUri(buttons[0].value)
}

 const loadButtons = async(itemValue:string, itemIndex:number) => {
    //console.log(filteredLocations[itemIndex])
    setSelectedValue(itemValue)

    let buttons = await getCameraData(itemValue)
    let latitude = filteredLocations[itemIndex].lat
    let lognitude = filteredLocations[itemIndex].lon
    setCameraLocation({lat: latitude, lon:lognitude})

    setCameraButtons(buttons)

    setImageUri(buttons[0].value)

 }

 const sortByDistance = (latitude, longitude, locs) => {

  let sortedLocs = locs

  sortedLocs.sort( function(a, b) { 

    //const aDist = Math.sqrt( Math.pow(a.lat - latitude, 2) + Math.pow(a.lon - longitude, 2))
    //const bDist = Math.sqrt( Math.pow(b.lat - latitude, 2) + Math.pow(b.lon - longitude, 2))
    return a.distance > b.distance
    /*
    if (aDist > bDist) {
      return 1
    }
    if (aDist < bDist) {
      return -1
    }
    else {
      return 0
    }
    */
    
  })

  return sortedLocs
  //setLocations(sortedLocs)
  //filterChange(filterText)

 }

 const sortByCity = (locs) => {
  let sortedLocs = locs
  sortedLocs.sort( function(a, b) { 

    const aCity = a.city.toLowerCase()
    const bCity = b.city.toLowerCase()

    
    return aCity > bCity;
  })
  return sortedLocs
 }


 const sort = (method:string) => {
   let sortedLocs = locations;
   if (method == "abc") {
     sortedLocs = sortByCity(sortedLocs)
   }
   else if (method == "distance") {
     sortedLocs = sortByDistance(lat, lon, sortedLocs)
   }
   setSortMode(method)
   setLocations(sortedLocs)
   filterChange(filterText)

   loadInitial(sortedLocs[0].id, sortedLocs[0].lat, sortedLocs[0].lon)

 }

 const imageButton = async(url) => {

  setImageUri(url)

 }

 const filterChange = async(text:string) => {
   setFilterText(text)
   let filtered = []
   locations.forEach(location => {
     if (location.name.toLowerCase().includes(text.toLowerCase())) {
       filtered.push(location)
     }
   })
   setFilteredLocations(filtered)
 }

 const clearFilter = async() => {
   filterChange("")
 }

 const refreshLocation = async() => {
    const location = await getLocation();
    if (location.length === 2) {
      setLat(location[0])
      setLon(location[1])
      locations.forEach(l => {
        l.distance = getDistanceFromLatLonInKm(location[0], location[1], l.lat, l.lon)
      })

      setMaxDistance(locations[locations.length -1].distance)

    }
    if (sortMode == "distance") {
      let sorted = sortByDistance(location[0], location[1],locations )//sortByDistance(location[0], location[1], cameras)
      setLocations(sorted)
      setFilteredLocations(sorted)
      setFilterText("")


    }  
  
 }
 const showMap = (latitude: number, longitude: number) => {
  openMap({ latitude:latitude, longitude: longitude });
 }

  return (
    <SafeAreaView style={{flex:1, flexDirection:"column"}}>
      <View style={{flex: 1,  marginTop: "0%", justifyContent:"flex-start"}}>

        <View style={{flexDirection:"row", justifyContent:"space-around"}}>
          <TextInput
            onChangeText={filterChange}
            value={filterText}
            placeholder="Filter"
            style={{width:"80%"}}
            ></TextInput>


          <TouchableOpacity onPress={() => clearFilter()}>

          <MaterialIcon name="clear" size={40} color="#f00"  />

          </TouchableOpacity>

        </View>
        <View style={{flexDirection:"row", justifyContent:"flex-start"}}>

          <Text style={{marginLeft:"0%"}}>Current location: {lat.toFixed(5)}, {lon.toFixed(5)} </Text>


          <TouchableOpacity onPress={() => showMap(lat, lon)}>

          <MaterialCommunityIcon name="google-maps" size={40} color="#f00"   />
          </TouchableOpacity>

          <Text> </Text>



          <TouchableOpacity onPress={() => refreshLocation()}>
          <MaterialIcon name="refresh" size={40} color="#0f0"  />
        </TouchableOpacity>


        </View>
        <View style={{flexDirection:"row", justifyContent:"flex-start"}}>
          <Text>Sort by: </Text>
          <Button
            mode="contained"
            color={BUTTONCOLOR}

            style={styles.button}
            onPress={() => sort("distance")} >
            <Text style={styles.buttonText}>Distance</Text>
          </Button>

          <Text> </Text>


          <Button
            mode="contained"
            color={BUTTONCOLOR}

            style={styles.button}
            onPress={() => sort("abc")}>
            <Text style={styles.buttonText}>City name (asc)</Text>
          </Button>


        </View>

      <Picker
      selectedValue={selectedValue}
      style={{height: 50, width: "100%"}}
      onValueChange={loadButtons}
      >
      {filteredLocations.map((item, index) => {
          return <Picker.Item value={item.id} color={getItemColor(item.distance, maxDistance)} label={item.name + ", "+item.distance.toFixed(1).toString() + "km"} key={index} >
            </Picker.Item>
      })
      }
      </Picker>

      <View style={{flexDirection:"row", justifyContent:"flex-start"}}>

        <Text>Camera location: {cameraLocation.lat.toFixed(5)}, {cameraLocation.lon.toFixed(5)}</Text>

        <TouchableOpacity onPress={() => showMap(cameraLocation.lat, cameraLocation.lon)}>
          <MaterialCommunityIcon name="google-maps" size={40} color="#f00"  />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{flex: 1,  height: 50, maxHeight: 50, width: "100%"}}>
      <FlatList
          horizontal={true}
              data={
              cameraButtons
              }
              renderItem={({item}) => 
              


              <Button
              mode="contained"
              color={BUTTONCOLOR}
  
              style={styles.button}
              onPress={() => imageButton(item.value)} 
              >
             <Text style={styles.buttonText}>{item.label} </Text>
            </Button>
  
              
              }/>
      </SafeAreaView>




      </View>
      <View style={{flex: 1,  marginTop: "0%", justifyContent:"flex-start"}}>

      <Image
              style={{width: "100%", height: "100%",}}
              source={{uri: imageUri}}
            />

</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    //width: 50,
    height: 50,
    justifyContent: 'center',

  },
  buttonText:
  {
    color:"#ffffff"
  }
});

const BUTTONCOLOR = "#6666FF"



export default App;
