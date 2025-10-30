import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Box from "./Box";

const Board = ({ 
  playerTurn, 
  squares, 
  onplay 
}: { 
  playerTurn: boolean; 
  squares: (string | null)[]; 
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
  
  function calculateWinner(squares: (string | null)[]) {
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

    const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < 3; row++) {
      const boxes = [];
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        boxes.push(
          <Box 
            key={index}
            Value={squares[index]} 
            onPress={() => handleBoxPress(index)} 
          />
        );
      }
      rows.push(
        <View key={row} style={styles.boardrow}>
          {boxes}
        </View>
      );
    }
    return rows;
  };
  return (
    <View style={styles.container}>
      <View style={[
        styles.board,
        isMobile && styles.mobileBoard
      ]}>
        {renderBoard()}
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