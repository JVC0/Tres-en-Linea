import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from "react-native";

const Box = ({
  Value,
  onPress,
}: {
  Value: string | null;
  onPress: (event: GestureResponderEvent) => void;
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const boxSize = isMobile ? 70 : 90;

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
    fontSize: 28,
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