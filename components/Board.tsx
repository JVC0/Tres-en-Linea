import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Box from "./Box";

const Board = ({ 
  playerTurn, 
  squares, 
  onplay,
  boardSize = 3
}: { 
  playerTurn: boolean; 
  squares: (string | null)[]; 
  onplay: Function;
  boardSize?: number;
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  function handleBoxPress(boxIndex: number) {
    if (squares[boxIndex] || calculateWinner(squares).winner) {
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
  
  function calculateWinner(squares: (string | null)[]) {
    const lines: number[][] = [];
    
    for (let i = 0; i < boardSize; i++) {
      const row = [];
      for (let j = 0; j < boardSize; j++) {
        row.push(i * boardSize + j);
      }
      lines.push(row);
    }
    
    for (let i = 0; i < boardSize; i++) {
      const col = [];
      for (let j = 0; j < boardSize; j++) {
        col.push(j * boardSize + i);
      }
      lines.push(col);
    }
    
    const diag1 = [];
    for (let i = 0; i < boardSize; i++) {
      diag1.push(i * boardSize + i);
    }
    lines.push(diag1);
    
    const diag2 = [];
    for (let i = 0; i < boardSize; i++) {
      diag2.push(i * boardSize + (boardSize - 1 - i));
    }
    lines.push(diag2);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const first = squares[line[0]];
      if (first && line.every(index => squares[index] === first)) {
        return {
          winner: first,
          winningLine: line
        };
      }
    }
    
    return {
      winner: null,
      winningLine: null
    };
  }
  
  const winnerInfo = calculateWinner(squares);
  const winner = winnerInfo.winner;
  const winningLine = winnerInfo.winningLine;
  
  let status;
  if (winner) {
    status = "🎉 ¡Ganador: " + (winner === "X" ? "❌" : "🟢") + "!";
  } else if (squares.every(square => square !== null)) {
    status = "🤝 ¡Empate!";
  } else {
    status = "Siguiente jugador: " + (playerTurn ? "❌" : "🟢");
  }

  const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < boardSize; row++) {
      const boxes = [];
      for (let col = 0; col < boardSize; col++) {
        const index = row * boardSize + col;
        const isWinningBox = winningLine && winningLine.includes(index);
        
        boxes.push(
          <Box 
            key={index}
            Value={squares[index]} 
            onPress={() => handleBoxPress(index)}
            boardSize={boardSize}
            isWinningBox={isWinningBox}
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