import React, { Component } from 'react';
import {Text,View,FlatList,TouchableOpacity,Image,ActivityIndicator,ImageBackground,Platform} from "react-native";
import Navbar from '@components/Navbar'
import { SearchBar } from 'react-native-elements'
import T from '@functions/translation'
import firebase from '@datapoint/Firebase'
import Smartrow from '@smartrow'
import TouchList from '@uniappbuttons/TouchList';
import SmartIcon from '@smarticon';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

import * as Permissions from 'expo-permissions';

class Home extends Component {
  _keyExtractor = (item) => item.id;

  constructor(props) {
    super(props);
    var isDataInProps=props.navigation.state.params==null
    this.state = {
        pr:isDataInProps?props.data:props.navigation.state.params,
        categoryItems:[],
        items:[],
        itemsStore:[],
        location: null,
        errorMessage: null,
        city:null
    };
    
   this.getCategories = this.getCategories.bind(this);
   this._getLocationAsync = this._getLocationAsync.bind(this);
   this.editLocation = this.editLocation.bind(this);
   
   
  }

  componentDidMount(){
    this.getCategories()
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }
  }

  _getLocationAsync = async () => {
    
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    
    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
    
    let address = await Location.reverseGeocodeAsync({latitude: location.coords.latitude, longitude:location.coords.longitude})
    
    this.setState({
      city:address[0].city
    })
  };


   //Get the data of the category
   getCategories(){
    //Get the meta data

    //Get reference to this
    var _this=this;

    //Get reference to Firestore
    var db = firebase.firestore();

    //Place to store the categories
    var categories = [];
    

    if(this.state.pr.listingSetup.hide_all_category_filter){
      categories=[];
    }
    
    
    //Start getting the categories
    db.collection("/"+this.state.pr.listingSetup.collection_key).get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
          var objToAdd=JSON.parse(doc._document.data.toString());
          //Add the id, on each object, easier for referencing
          objToAdd.id=doc.id;
          categories.push(objToAdd);

      });


      //After data is stored in data, update the state
      //This will re-render the screen

      var upState={
        categoryItems:categories,
        animating:false
      }
      console.log(_this.state.pr.listingSetup.hide_all_category_filter+"<----")
      if(_this.state.pr.listingSetup.hide_all_category_filter&&categories.length>0){
        upState.selected=categories[0].id
      }

      _this.setState(upState)
     
    });
  }

  /**
   * Navigate to Location screen
   */
  editLocation(){
    this.props.navigation.navigate("LocationScreen",{location:this.state.location})
  }
  
  

  render() {
    
    return (
      <View>
          <Navbar
          navigation={this.props.navigation}
          isRoot={true}
          showRightButton={false}
        />
         <SearchBar lightTheme placeholder={T.searchBarText} ref={search => this.search = search} containerStyle={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onChangeText={this.searchChange}  />
         <TouchList categoryItems={this.state.categoryItems}></TouchList>
         <View style={{flexDirection:"row",marginTop:20}}>
          <View>
              <Text style={{color:"#434F64",fontWeight:'900',fontFamily: 'lato-bold',fontSize:23,marginLeft:10}}>{this.state.city}</Text>
          </View>
          <View style={{flex:1}}>
             <TouchableOpacity style={{flexDirection:"row",justifyContent:"flex-end",marginTop:10}} onPress={() => this.editLocation()}>
               <Text style={{color:"#5561FA",fontWeight:'300',fontFamily: 'lato-bold',fontSize:14,marginLeft:10}}>Edit</Text>
               <SmartIcon defaultIcons={"MaterialIcons"} name={"FeChevronRight"}  size={15} color="#5561FA" style={{marginRight: 10}}/>
             </TouchableOpacity>
           </View>
         </View>
         
      </View>
    );
  }
}

export default Home;
