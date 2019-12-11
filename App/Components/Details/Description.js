import React, {Component} from "react";
import {Text, View,  UIManager, ScrollView, Dimensions,Linking } from "react-native";
import css from '@styles/global'
import HTML from 'react-native-render-html';



export default class Description extends Component {
  constructor(props) {
    super(props);
    this.state = {
      setup:this.props.display,
      rtl:css.dynamic.general.isRTL
    }
  }

  componentWillMount() {
    if (UIManager.setLayoutAnimationEnabledExperimental)
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }



  render() {
      const rtlText = this.state.rtl && { textAlign: 'right', writingDirection: 'rtl' };
      const rtlView = this.state.rtl && { flexDirection: 'row-reverse' };
    return (
      <View style={[{marginTop:15,marginLeft:10,marginRight:10},rtlText]}>
        <Text style={[{textAlign: 'left', color:'#666b73',fontSize:20, marginBottom:5,fontFamily: 'lato-bold'},rtlText]}>{this.props.title}</Text>
        <HTML html={this.props.text} imagesMaxWidth={Dimensions.get('window').width} onLinkPress={(event, href)=>{
            Linking.openURL(href)
          }}/>
      </View>
    );
  }
}
