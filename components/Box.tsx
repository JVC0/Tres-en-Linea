import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from "react-native";

const Box = ({
  Value,
  onPress,
  boardSize = 3,
  isWinningBox = false,
}: {
  Value: string | null;
  onPress: (event: GestureResponderEvent) => void;
  boardSize?: number;
  isWinningBox?: boolean;
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
        { width: boxSize, height: boxSize },
        isWinningBox && styles.winningSquare
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        { fontSize },
        Value === 'X' && styles.xText,
        Value === 'O' && styles.oText,
        isWinningBox && styles.winningText
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
  winningSquare: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  text: {
    fontWeight: "bold",
  },
  xText: {
    color: '#e74c3c',
  },
  oText: {
    color: '#27ae60',
  },
  winningText: {
    transform: [{ scale: 1.1 }],
  }
});

export default Box;