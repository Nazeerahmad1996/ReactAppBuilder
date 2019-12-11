import React, { Component } from 'react';
import { View, Text,Platform,Slider,StyleSheet,Dimensions,SafeAreaView } from 'react-native';
import SmartIcon from '@smarticon';
import MapView from 'react-native-maps';
import Navbar from '@components/Navbar'
import Button from '@uniappbuttons/Button';
import css from '@styles/global'
let Marker = MapView.Marker;
let Circle = MapView.Circle;

class LocationScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude:this.props.navigation.state.params.location.coords.latitude,
      longitude:this.props.navigation.state.params.location.coords.longitude,
      latitudeDelta: 0.00522,
      longitudeDelta: Dimensions.get("window").width / Dimensions.get("window").height * 0.00522,
      initialVal:0,
      prevVal:0
      
    };
    this.checkTheValue = this.checkTheValue.bind(this);
    this.onPressZoomIn = this.onPressZoomIn.bind(this);
    this.onPressZoomOut = this.onPressZoomOut.bind(this);
    this.setLatLng=this.setLatLng.bind(this)
  }
  
 /**
  * Compare the current value with the prev value from the slider
  * @param {Number} value 
  */
  checkTheValue(value){
    if(value > this.state.prevVal){

      //Call zoom out function
     this.onPressZoomOut(value)
    }else if(value < this.state.prevVal){

      //Call zoom in function
      this.onPressZoomIn(value)
    }
    this.state.prevVal=value
  }
 
  /**
   * Function for zoom in the map
   * @param {Number} value 
   */
  onPressZoomIn(value) {
    
    region = {
        latitude: this.state.latitude,
        longitude: this.state.longitude,
        latitudeDelta: this.state.latitudeDelta / (20-value),
        longitudeDelta: this.state.longitudeDelta / (20-value)
        }
    this.setState={
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
        latitude: region.latitude,
        longitude: region.longitude,
        
    }
    this.map.animateToRegion(region, 100);
    
}

/**
   * Function for zoom out the map
   * @param {Number} value 
   */
  onPressZoomOut(value) {
  
      region = {
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          latitudeDelta: this.state.latitudeDelta*value,
          longitudeDelta: this.state.longitudeDelta *value
          }
      this.setState={
        latitudeDelta:  region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
        latitude: region.latitude,
        longitude: region.longitude,
        
      }
      this.map.animateToRegion(region, 100);
    
  }

  setLatLng(e){
    
    
      this.state.longitude=e.nativeEvent.coordinate.longitude
      this.state.latitude=e.nativeEvent.coordinate.latitude
    
  }
  render() {
   
    return (
        <View>
            <Navbar
                navigation={this.props.navigation}
                isRoot={false}
                showRightButton={false}
            />
            
            <MapView
                    style={{ height:400,margin:10,borderRadius:10}}
                    zoomEnabled={true}
                    minZoomLevel={0}
                    maxZoomLevel={20}
                    ref={ref => {
                      this.map = ref;
                    }}
                    initialRegion={{
                    latitude: this.state.latitude,
                    longitude: this.state.longitude,
                    latitudeDelta: this.state.latitudeDelta,
                    longitudeDelta: this.state.longitudeDelta
                   }}> 
                    <Circle
                      center={{latitude:this.state.latitude,longitude:this.state.longitude}}
                      radius={100}
                      fillColor={"rgba(255,255,255,0.5)"}
                      strokeWidth={1}
                      strokeColor={"rgba(255,255,255,0.5)"}
                     
                    >
                    </Circle>
                      <Marker 
                          coordinate={{latitude:this.state.latitude,longitude:this.state.longitude}}
                          onDragEnd={(e) => {
                            this.setLatLng(e)
                            
                            }}
                          draggable
                        />
                </MapView>
                <View style={{flexDirection:"row",margin:10}}>
                    <SmartIcon defaultIcons={"MaterialIcons"} name={"FeHome"}  size={25} color="#5561FA" style={{marginLeft:10}}/>
                    <Slider
                        style={{ flex: 1,marginLeft:10,marginRight:10 }}
                        value={this.state.initialVal}
                        minimumValue={0}
                        maximumValue={20}
                        step={1}
                        onValueChange={value =>{
                          this.checkTheValue(value)
                        }}
                        minimumTrackTintColor={
                          Platform.OS == 'ios' ? "#5561FA" : '#bbb'
                        }
                    />
                   <SmartIcon defaultIcons={"MaterialIcons"} name={"FeTrendingUp"}  size={25} color="#5561FA"/>
                  </View>
                <View style={css.layout.orderCounter}>
                  <View style={{flex: 1}}>
                    <Button
                      onPress={()=>{
                        
                       alert("Hi")
                      }}
                      text={"Valerija"} />
                  </View>
                </View>
       </View>
      
    );
  }
}

export default LocationScreen;
