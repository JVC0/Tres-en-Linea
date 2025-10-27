import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Box from "./Box";

const Board = ({ 
  playerTurn, 
  squares, 
  onplay 
}: { 
  playerTurn: boolean; 
  squares: Array<string | null>; 
  onplay: Function; 
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  function handleBoxPress(boxIndex: number) {
    if (squares[boxIndex] || calculateWinner(squares)) {
      return;
    }
    const newSquares = squares.slice();
    if (playerTurn) {
      newSquares[boxIndex] = "X";
    } else {
      newSquares[boxIndex] = "O";
    }
    onplay(newSquares);
  }
  
  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = "🎉 ¡Ganador: " + (winner === "X" ? "❌" : "🟢") + "!";
  } else if (squares.every(square => square !== null)) {
    status = "🤝 ¡Empate!";
  } else {
    status = "Siguiente jugador: " + (playerTurn ? "❌" : "🟢");
  }
  
  function calculateWinner(squares: Array<string | null>) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.board,
        isMobile && styles.mobileBoard
      ]}>
        <View style={styles.boardrow}>	
          <Box Value={squares[0]} onPress={() => {handleBoxPress(0)}} />
          <Box Value={squares[1]} onPress={() => {handleBoxPress(1)}}/>
          <Box Value={squares[2]} onPress={() => {handleBoxPress(2)}}/>
        </View>
        <View style={styles.boardrow}>
          <Box Value={squares[3]} onPress={() => {handleBoxPress(3)}}/>
          <Box Value={squares[4]} onPress={() => {handleBoxPress(4)}}/>
          <Box Value={squares[5]} onPress={() => {handleBoxPress(5)}}/>
        </View>
        <View style={styles.boardrow}>
          <Box Value={squares[6]} onPress={() => {handleBoxPress(6)}}/>
          <Box Value={squares[7]} onPress={() => {handleBoxPress(7)}}/>
          <Box Value={squares[8]} onPress={() => {handleBoxPress(8)}}/>
        </View>
      </View>
      <Text style={[
        styles.status,
        winner && styles.winnerText,
        isMobile && styles.mobileStatus
      ]}>
        {status}
      </Text>			
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  board: {
    backgroundColor: '#34495e',
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  mobileBoard: {
    transform: [{ scale: 0.9 }],
  },
  boardrow: {
    flexDirection: "row",
  },
  status: {
    marginTop: 25,
    fontSize: 20,
    fontWeight: '600',
    textAlign: "center",
    color: '#2c3e50',
    paddingHorizontal: 20,
  },
  mobileStatus: {
    fontSize: 18,
    marginTop: 20,
  },
  winnerText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 22,
  },
});

export default Board;