import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from "react-native";

const Box = ({
  Value,
  onPress,
  boardSize = 3,
}: {
  Value: string | null;
  onPress: (event: GestureResponderEvent) => void;
  boardSize?: number;
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const getBoxSize = () => {
    if (isMobile) {
    
      if (boardSize === 3) return 70;
      if (boardSize === 4) return 60;
      if (boardSize === 5) return 50;
      if (boardSize === 6) return 42;
      return 36; 
    } else {
      
      if (boardSize === 3) return 90;
      if (boardSize === 4) return 75;
      if (boardSize === 5) return 60;
      if (boardSize === 6) return 50;
      return 43; 
    }
  };
  
  const boxSize = getBoxSize();
  const fontSize = boxSize * 0.4; 

  return (
    <TouchableOpacity 
      style={[
        styles.square,
        { width: boxSize, height: boxSize }
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        { fontSize },
        Value === 'X' && styles.xText,
        Value === 'O' && styles.oText
      ]}>
        {Value === 'X' ? '❌' : Value === 'O' ? '🟢' : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    backgroundColor: "#ecf0f1",
    borderWidth: 2,
    borderColor: "#bdc3c7",
    margin: 3,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  text: {
    fontWeight: "bold",
  },
  xText: {
    color: '#e74c3c',
  },
  oText: {
    color: '#27ae60',
  }
});

export default Box;