/*
  Created by Dimov Daniel
  Mobidonia
  daniel@mobidonia.com
*/
import React, {Component,PropTypes} from "react";
import {View,Text,TouchableOpacity,Image,Modal,ActivityIndicator} from "react-native";
import ChatNav from '@components/ChatNav'
import css from '@styles/global';
import { GiftedChat,Send,Bubble,InputToolbar,Time } from 'react-native-gifted-chat'
import SmartIcon from '@smarticon';


export default class Chat extends Component {

  static navigationOptions = {
    title: '',
    header: null,
  };

  //The constructor
  constructor(props) {
    super(props);
    this.state = {
      animating:this.props.animating,
      currentMessage: [],
      currentMessageText:[],
      typingText:"Enter your message",
      showImageViewer:false,
    }
    
    this.renderAddImage=this.renderAddImage.bind(this);
  }
  

  /**
   * Render add image icon 
   */
    renderAddImage(){
      return (
        <View style={{marginBottom:5,opacity:0.7,padding:5}}>
          <TouchableOpacity 
            onPress={this.props.callBackPickImage}>
            <SmartIcon defaultIcons={"MaterialIcons"} name={"MdPhoto"} size={25} color='black'/>
          </TouchableOpacity>
        </View>
        
      )
    }


  /**
   * Render message bubble
   */
    renderBubble = (props) => {
      let wrapperStyle = {
          left: {
              padding: 10,
              backgroundColor: '#2E3359',
          },
          right: {
              padding: 10,
              backgroundColor: '#2E3359',
          }
      };
      let textStyle = {
          left: {
              color: '#ffffff',
              fontSize: 16
          },
          right: {
              color: '#ffffff',
              fontSize: 16,
          }
      };

      let wrapperStyleQuestionBubble = {
        backgroundColor: '#ffffff',
        borderColor: '#40216F',
        borderWidth: 3,
        borderRadius: 10,
      }

      let wrapperStyleQuestionBubbleTextColor = '#40216F';

      let TouchableOpacityBubbleStyle = {
          borderColor: '#FF33AA',
          borderWidth: 3,
          backgroundColor: '#33AAFF',
      }

      if (props.currentMessage.richCard) {

          wrapperStyle.left = wrapperStyleQuestionBubble;
          textStyle.left.color = wrapperStyleQuestionBubbleTextColor;

          return (
              <TouchableOpacity>
                  <Bubble
                      {...props}
                      onPress={() => props.sendRichCard(props.currentMessage)}
                      wrapperStyle={wrapperStyle}
                      textStyle={textStyle}/>
              </TouchableOpacity>
          );
      }

      return (
          <Bubble
              {...props}
              wrapperStyle={wrapperStyle}
              textStyle={textStyle}/>
      );
  }

  /**
   * Render the input toolbar 
   * @param {*} props 
   */
  renderInputToolbar(props) {
    return <InputToolbar {...props} containerStyle={{backgroundColor:"white"}}  />;
  }

  /**
   * Render Time when the message was send
   */
  renderTime(props) {
    const timeStyle = {
    color: 'blue'
    };
    return <Time {...props} textStyle={{left: timeStyle, right: timeStyle}}/>
    }
  
  /**
   * Render footer
   * @param {} props 
   */
  renderFooter(props) {
    return (
        <ActivityIndicator
            animating={this.state.animating}
            style={{flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginRight:20}}
            color={"black"}
            size="small"
            hidesWhenStopped={true}/>
      )
    
   
  }

  /**
  * Render the message when the message has image
  * @param {*} props 
  */ 
  _renderMessageImage(props){
    return(
      <Image
        style={{
        borderRadius: 3,
        marginLeft: 0,
        marginRight: 0,
        width:100,
        height:100,
      }}
      source={{uri: props.currentMessage.image}}
    />
    );
  }

  render() {
      
    return (
        <View style={[css.layout.containerBackground,{flex:1}]}>
          <ChatNav navigation={this.props.navigation} userName={this.props.selectedUserFullname} userAvatar={this.props.selectedUserAvatar} isRoot={this.props.isRoot} showRightButton={false} backAction={this.props.back} />
          <GiftedChat
                  bottomOffset={css.isIphoneX()?85:0}
                  messages={this.props.messages}
                  locale='zh-cn'
                  timeFormat='LT'
                  dateFormat='LL'
                  onSend={message =>{
                   message[0].createdAt = (new Date()).getTime()
                    this.setState({
                      currentMessageText:message[0]
                    })
                   
                    var _this=this;
                    //CallBack for push the message to Database
                    this.props.pushTheMessageTo(message[0])
                  
                    //If path is message than write the message to selected and current user
                   setTimeout(function(){
                      if(_this.props.path == "messages/"){
                        _this.props.addToChatsInDataBase(_this.state.currentMessageText); 
                      }
                      }, 2000);
                  }}
                  renderBubble={this.renderBubble}
                  renderInputToolbar={this.renderInputToolbar}
                  renderFooter={this.renderFooter.bind(this)}
                  renderActions={this.renderAddImage}
                  renderTime={this.renderTime}
                  renderSend={
                    (props) =>{
                    return (
                        <Send
                            {...props}
                        >
                        <View style={{marginBottom:5,opacity:0.7,padding:5}}>
                            <SmartIcon style={{marginBottom:10}} defaultIcons={"MaterialIcons"} name={"MdSend"} size={25} color='black'/>
                        </View>
                           
                        </Send>
                    );
                }}
                dateFormat={'dddd DD. MMMM'}
                  user={{
                    _id: this.props.userID,
                    name: this.props.name,
                    avatar: this.props.avatar,
                  }}>
            <Modal
              visible={this.state.showImageViewer}
              transparent={true}>
              <Image
                source={{ uri: this.props.imageUrl }}
                style = {css.imageChat}
              />
            </Modal>
                </GiftedChat>
        </View>
    )
  }
}
