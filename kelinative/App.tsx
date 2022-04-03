//TODO: next fetch image from button press to img viewer

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
  Image
} from 'react-native';
import { useState , useEffect} from "react";
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
    let province = element.properties.municipality
    let x = element.geometry.coordinates[0]
    let y = element.geometry.coordinates[1]
    let status = element.properties.collectionStatus
    if (status == "GATHERING") {
      cameras.push({name: name + ", " + mun , id: id, x: x, y:y})

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
  const [locations, setLocations] = useState([{id: "0", name: "loading"}])
  const [cameraButtons, setCameraButtons] = useState([{label: "temp", value: ""}])
  const [initialized, setInitialized] = useState(false);
  const [imageUri, setImageUri] = useState("https://i.kym-cdn.com/entries/icons/facebook/000/026/981/0bd0ed742059cd7f4c83882095aeb3752e45dfbfv2_hq.jpg")
  //ei välttis tarvii, alemmasta saa myös id:t
  //getCameras()


  useEffect(() => {
    async function initialize() {

      let cameras =  await getCameraLocations()
      //setLocations(cameras)


      
    RNLocation.requestPermission({
      ios: "whenInUse",
      android: {
        detail: "coarse"
      }
    }).then(granted => {
      if (granted) {
        //let locationSubscription = RNLocation.subscribeToLocationUpdates(locs => {
        RNLocation.getLatestLocation({ timeout: 60000 }).then(loc => {
          //let lat = locs[0].latitude;
          //let lon = locs[0].longitude;
          let lat = loc.latitude
          let lon = loc.longitude
          console.log('location: ', lat, lon);



          let sortedLocs = cameras
          console.log(sortedLocs.length)
          sortedLocs.sort( function(a, b) { 

            const aDist = Math.abs(a.x - lat) + Math.abs(a.y - lon)
            const bDist = Math.abs(b.x - lat) + Math.abs(b.y - lon)

            
            return aDist - bDist;
          })
          if (!initialized) {
            setLocations(sortedLocs)
            setInitialized(true)
          }
          //setLocations(cameras)
          
        })
      }
      else {
        console.log("no gps")
        Alert.alert("Allow location permissions to sort cameras based on distance to current position")
      }
      
    })
        
        


    }

    initialize()
 }, [])

 const loadButtons = async(itemValue, itemIndex) => {
    //setSelectedValue(itemValue)
    let buttons = await getCameraData(itemValue)
    setCameraButtons(buttons)

    setImageUri(buttons[0].value)
 }

 const imageButton = async(url) => {

  setImageUri(url)

 }

  /*
  if (!initialized) {
    let cameras =  await getCameraLocations()

    
    //setLocations(cameras)
    console.log("ok")
    setInitialized(true)
  }

            <Button title={"item.label"} ></Button>
          <Button title={"item.label2"} ></Button>


  */

  return (
    <SafeAreaView style={{flex:1, flexDirection:"column"}}>

<View style={{flex: 1,  marginTop: "5%", justifyContent:"flex-start"}}>

<Picker
selectedValue={selectedValue}
style={{height: 50, width: 100}}
onValueChange={loadButtons}
>
{locations.map((item, index) => {
    return <Picker.Item value={item.id} label={item.name} key={index} />
})
}
</Picker>

<View style={{flex: 1, justifyContent:"center", height: 50, maxHeight: 50}}>

<FlatList
    horizontal={true}
        data={
         cameraButtons
        }
        renderItem={({item}) => <Button title={item.label} onPress={() => imageButton(item.value)}></Button>}
        >


        </FlatList>

</View>
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
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />

*/

/*
onValueChange={(itemValue, itemIndex) => {

        
          //setSelectedValue(itemValue)
          loadButtons(itemValue)

        }
        }



{
cameraButtons.map((item, index) => {
  <Text>
  {item.label}
  </Text>

})
}

*/