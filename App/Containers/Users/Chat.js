/*
  Created by Dimov Daniel
  Mobidonia
  daniel@mobidonia.com
*/
import React, {Component,PropTypes} from "react";
import * as firebase from 'firebase';
import { View,ScrollView,Platform,Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import ChatUI from '@components/LoginUI/ChatUI';
import Login from '@containers/Users/LoginScreen'


export default class Chat extends Component {

  static navigationOptions = {
    title: '',
    header: null,
  };

  //The constructor
  constructor(props) {
    super(props);
    this.state = {
      avatar:"",
      selectedUserAvatar:"",
      selectedUserFullname:"",
      name:"",
      userID:"",
      messages: [],
      imageUrl:"",
      animating:false,
      currentMessage: [],
      currentMessageText:[],
      selectedUser:this.props.navigation.state.params.selectedUser,
      chatID: "",
      documentID: this.props.navigation.state.params.id,
      path:this.props.navigation.state.params.path,
      image:this.props.navigation.state.params.image,
      title:this.props.navigation.state.params.title,
      waitingForStatus:true,
      isLoggedIn:false,
      
    }
    this.setUpCurrentUser=this.setUpCurrentUser.bind(this);
    this.getDataForSelectedUser=this.getDataForSelectedUser.bind(this);
    this.addToChatsInDataBase=this.addToChatsInDataBase.bind(this);
    this.writeChatsInDB=this.writeChatsInDB.bind(this);
    this.pushTheMessageTo=this.pushTheMessageTo.bind(this);
    this.back=this.back.bind(this);
    
  }



  componentDidMount(){
    firebase.auth().onAuthStateChanged(this.setUpCurrentUser);
    
    
}

  /**
   * SET THE USER
   * @param object user 
   */
  setUpCurrentUser(user){   
    var _this=this
    if (user != null) {
        // User is signed in.
        _this.setState({
            avatar:user.photoURL != null?user.photoURL:"",
            name : user.displayName,
            userID:firebase.auth().currentUser.uid,
            chatID: firebase.auth().currentUser.uid > this.props.navigation.state.params.selectedUser?firebase.auth().currentUser.uid + this.props.navigation.state.params.selectedUser:this.props.navigation.state.params.selectedUser + firebase.auth().currentUser.uid,
            isLoggedIn:true,
            waitingForStatus:false,
        })
        this.getMessages();
        this.getDataForSelectedUser();
    } else {

        // User is not signed in  
        this.setState({
          waitingForStatus:false,
          isLoggedIn:false,
      })
    }
  }

 /**
  * Get the message from database
  */ 
  getMessages(){
    var _this=this;
    var id = this.state.path=="comments/"?this.state.documentID:this.state.chatID
    
    firebase.database().ref(this.state.path + id).on('value', function(snapshot) {
        var theMessages=[]
        snapshot.forEach(function(childSnapshot) {
            var messageToAdd=childSnapshot.val()
            messageToAdd.id=childSnapshot.key;
            theMessages.push(messageToAdd);
        });
        _this.setState({
            messages:theMessages.reverse()
        })
      });

  }


  /**
   * Get data for the selected user
   */
  getDataForSelectedUser(){
    var _this=this;
    firebase.database().ref('/users/' + this.state.selectedUser).once('value').then(function(snapshot) {
        _this.setState({
            selectedUserAvatar:snapshot.val().avatar,
            selectedUserFullname: snapshot.val().fullName,
          })
    })
    
  }

  /**
   * Write in CHATS
   * @param {string} user1 
   * @param {string} user2 
   */
  writeChatsInDB(user1,user2,message){
    firebase.database().ref('chats/' + user1 + "/" + user2 ).update({
      avatar:user1==firebase.auth().currentUser.uid?this.state.selectedUserAvatar:this.state.avatar,
      name:user1==firebase.auth().currentUser.uid?this.state.selectedUserFullname:this.state.name,
      lastChat:Date.now(),
      id:user1==firebase.auth().currentUser.uid?user2:firebase.auth().currentUser.uid,
      lastMessage:message
    });
  }

  /**
   * Add in the list of chats as last message to both users
   * @param {Object} message 
   */
  addToChatsInDataBase(message){
    this.writeChatsInDB(firebase.auth().currentUser.uid,this.state.selectedUser,message)
    this.writeChatsInDB(this.state.selectedUser,firebase.auth().currentUser.uid,message)
  }

  /**
   * Push the message to Realtime Database
   * @param {Object} message 
   */
  pushTheMessageTo(message){
    var id = this.state.path=="comments/"?this.state.documentID:this.state.chatID
    firebase.database().ref(this.state.path + id).push().set(message);
  }

  

  /**
   * Image Picker
   */
  _pickImage = async () => {
     
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality:1,
    });
    
    if (!result.cancelled) {
     await this.uploadAsFile(result.uri, (progress) => {})
    }
  }

  /**
   * Upload the file picked from image picker
   */
  uploadAsFile = async (uri, progressCallback) => {
    const response = await fetch(uri);
    var _this=this;
    this.setState({
        animating:true
    })
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response); // when BlobModule finishes reading, resolve with the blob
     };
     xhr.onerror = function() {
       reject(new TypeError('Network request failed')); // error occurred, rejecting
     };
     xhr.responseType = 'blob'; // use BlobModule's UriHandler
     xhr.open('GET', uri, true); // fetch the blob from uri in async mode
     xhr.send(null); // no initial data
   });
    var metadata = {
      contentType: 'image/png',
    };
   
    let name = new Date().getTime() + "-media.png"
    const ref = firebase
      .storage()
      .ref()
      .child('chatPhotos/' + name)
   

    const task = ref.put(blob, metadata);
  
    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          progressCallback && progressCallback(snapshot.bytesTransferred / snapshot.totalBytes)
  
          var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(progress)
           
        },
        (error) => {reject(error)
            alert(error)
        }, /* this is where you would put an error callback! */
        () => {
           
          

          task.snapshot.ref.getDownloadURL().then(function(downloadURL) {
            var fullMessage = {
              _id: Math.random(),
              text: 'Image sent',
              createdAt: (new Date()).getTime(),
              image:downloadURL,
              user: {
                _id: _this.state.userID,
                name: _this.state.name,
                avatar: _this.state.avatar,
              },
            }
            var id = _this.state.path=="comments/"?_this.state.documentID:_this.state.chatID
            firebase.database().ref(_this.state.path  + id).push().set(fullMessage)
            _this.addToChatsInDataBase(fullMessage)

          _this.setState({
            imageUrl:downloadURL,
            animating:false
          })
          blob.close();
        });
        }
      );
    });
  }

  back(){
    this.props.navigation.pop();
  }


  render() {
    if(this.state.isLoggedIn){  
    return (
       <ChatUI
          
          selectedUser={this.state.selectedUser}
          selectedUserFullname={this.state.selectedUserFullname}
          selectedUserAvatar={this.state.selectedUserAvatar}
          userID={this.state.userID}
          name={this.state.name}
          avatar={this.state.avatar}
          messages={this.state.messages}
          path={this.state.path}
          documentID={this.state.documentID}
          chatID={this.state.chatID}
          imageUrl={this.state.imageUrl}
          addToChatsInDataBase={this.addToChatsInDataBase}
          pushTheMessageTo={this.pushTheMessageTo}
          callBackPickImage={this._pickImage}
          animating={this.state.animating}
          back={this.back}
          >
       </ChatUI> 
    )
    }else if(this.state.waitingForStatus){
      return(<View/>)
    }
    else if(!this.state.isLoggedIn){
      return(<Login navigation={this.props.navigation}/>)
    }
  }
}

