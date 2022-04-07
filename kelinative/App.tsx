//TODO: open map, (show on map) avaa kartalla kameran sijainti, nappula alasvetovalikon vieressä



import React from 'react';
import {
  Alert,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  FlatList,
  Image,
  TextInput
} from 'react-native';
import { useState , useEffect} from "react";

//import openMap from 'react-native-open-maps';

//import Geolocation from '@react-native-community/geolocation';

import RNLocation from 'react-native-location';

//import {Picker} from '@react-native-community/picker';
import {Picker} from  '@react-native-picker/picker';
//import RNPickerSelect from 'react-native-picker-select';




RNLocation.configure({ 
  distanceFilter: 0,
  //desiredAccuracy: {"android": "lowPower"}

});


async function GetAllCameras() {
  try {
  let response = await fetch(
  'https://tie.digitraffic.fi/api/v1/data/camera-data',
  );
  let responseJson = await response.json();
  console.log(responseJson);
  return responseJson;
  } catch (error) {
  console.error(error);
  }
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
    let name = element.properties.name
    let mun = element.properties.municipality
    let city = element.properties.municipality
    let x = element.geometry.coordinates[0]
    let y = element.geometry.coordinates[1]
    let status = element.properties.collectionStatus
    if (status == "GATHERING") {
      cameras.push({name: name + ", " + mun , id: id, lat: x, lon:y, city:city})

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
  const [locations, setLocations] = useState([{id: "0", name: "loading", city:"none"}])
  const [filteredLocations, setFilteredLocations] = useState([{id: "0", name: "loading", city:"none"}])
  const [cameraButtons, setCameraButtons] = useState([{label: "temp", value: ""}])
  const [initialized, setInitialized] = useState(false);
  const [imageUri, setImageUri] = useState("https://i.kym-cdn.com/entries/icons/facebook/000/026/981/0bd0ed742059cd7f4c83882095aeb3752e45dfbfv2_hq.jpg")
  const [filterText, setFilterText] = useState("")
  const [lat, setLat] = useState(0.0)
  const [lon, setLon] = useState(0.0)
  //ei välttis tarvii, alemmasta saa myös id:t
  //getCameras()



  useEffect(()=> {
    (async () => {
        const location = await getLocation();
        if (location.length === 2) {
          setLat(location[0])
          setLon(location[1])
          console.log(location)

          console.log(lat)
          console.log(lon)
    
        }
        let cameras =  await getCameraLocations()
        let sortedCameras = sortByCity(cameras)//sortByDistance(location[0], location[1], cameras)
        setLocations(sortedCameras)
        setFilteredLocations(sortedCameras)

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

 const loadButtons = async(itemValue:string, itemIndex:number) => {
    //setSelectedValue(itemValue)
    let buttons = await getCameraData(itemValue)
    setCameraButtons(buttons)

    setImageUri(buttons[0].value)
 }

 const sortByDistance = (latitude, longitude, locs) => {

  let sortedLocs = locs

  sortedLocs.sort( function(a, b) { 

    const aDist = Math.abs(a.lat - latitude) + Math.abs(a.lon - longitude)
    const bDist = Math.abs(b.lat - latitude) + Math.abs(b.lon - longitude)

    
    return aDist - bDist;
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
   setLocations(sortedLocs)
   filterChange(filterText)
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

  const rasterSourceProps = {
            id: 'stamenWatercolorSource',
            tileUrlTemplates: [
              'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
            ],
            tileSize: 256,
          };
  return (
    <SafeAreaView style={{flex:1, flexDirection:"column"}}>
      <View style={{flex: 1,  marginTop: "5%", justifyContent:"flex-start"}}>

      <TextInput
        onChangeText={filterChange}
        value={filterText}
      ></TextInput>
      <Button title="X" onPress={() => clearFilter()}/>
      <Text>Sort by:</Text>
      <Button title="Distance" onPress={() => sort("distance")}/>
      <Button title="City name (asc)" onPress={() => sort("abc")}/>

      <Picker
      selectedValue={selectedValue}
      style={{height: 50, width: 100}}
      onValueChange={loadButtons}
      >
      {filteredLocations.map((item, index) => {
          return <Picker.Item value={item.id} label={item.name} key={index} />
      })
      }
      </Picker>

      <SafeAreaView style={{flex: 1,  height: 50, maxHeight: 50, width: "50%"}}>
      <FlatList
          horizontal={true}
              data={
              cameraButtons
              }
              renderItem={({item}) => <Button title={item.label} onPress={() => imageButton(item.value)} ></Button>}/>
      </SafeAreaView>

      </View>
      <View style={{flex: 1,  marginTop: "5%", justifyContent:"flex-start"}}>

      <Image
              style={{width: 100, height: 100,}}
              source={{uri: imageUri}}
            />

</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
/*


*/

/*

    <Button
            onPress={goToYosemite}
            title="Click To Open Maps 🗺" />
*/