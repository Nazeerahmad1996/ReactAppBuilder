'use strict';

import React, {Component} from "react";
import {Text, View, TouchableOpacity} from "react-native";
import style from "./style";
import css from '@styles/global'


export default class Button extends Component {
  constructor(props) {
    super(props);
    this.state = {
      setup:this.props.display
    }
  }


  render() {
    return (
      <View  style={[{flex:1}]}>
        <TouchableOpacity style={[style.button, this.props.style,{backgroundColor:this.props.backgroundColor == null?css.dynamic.general.buttonColor:this.props.backgroundColor,borderColor:this.props.backgroundColor == null?css.dynamic.general.buttonBorderColor:this.props.backgroundColor},{"overflow":"hidden",borderRadius:css.dynamic.general.rounded+""=="true"?3:0}]} onPress={this.props.onPress}>
          <Text style={[style.buttonText,{opacity:this.props.opacity?this.props.opacity:1,color:css.dynamic.general.buttonText}]}>{this.props.text}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
