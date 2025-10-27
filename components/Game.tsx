import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Board from "./Board";

const Game = () => {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const playerTurn = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  
  function handlePlay(nextSquares: Array<string | null>) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }
  
  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }
  
  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = `Ir a la jugada #${move}`;
    } else {
      description = 'Ir al inicio del juego';
    }
    
    const isCurrentMove = move === currentMove;
    
    return (
      <View key={move} style={[
        styles.moveItem,
        isCurrentMove && styles.currentMove
      ]}>
        <TouchableOpacity 
          style={[
            styles.moveButton,
            isCurrentMove && styles.currentMoveButton
          ]} 
          onPress={() => jumpTo(move)}
        >
          <Text style={[
            styles.moveText,
            isCurrentMove && styles.currentMoveText
          ]}>
            {description}
          </Text>
        </TouchableOpacity>
      </View>
    );
  });

  return (        
    <View style={styles.container}>
      <View style={[
        styles.gameContainer,
        isMobile ? styles.mobileLayout : styles.desktopLayout
      ]}>
        <View style={styles.boardSection}>
          <Text style={styles.title}>Tres en Raya</Text>
          <Board playerTurn={playerTurn} squares={currentSquares} onplay={handlePlay} />
        </View>
        
        <View style={[
          styles.historySection,
          isMobile && styles.mobileHistory
        ]}>
          <Text style={styles.historyTitle}>Historial</Text>
          <ScrollView 
            style={styles.movesContainer}
            showsVerticalScrollIndicator={false}
          >
            {moves}
          </ScrollView>
        </View>
      </View>
    </View>
  );        
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 16,
  },
  gameContainer: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mobileLayout: {
    flexDirection: 'column',
  },
  desktopLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 40,
  },
  boardSection: {
    alignItems: 'center',
    flex: 1,
  },
  historySection: {
    minWidth: 250,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mobileHistory: {
    marginTop: 30,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  movesContainer: {
    maxHeight: 400,
  },
  moveItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  currentMove: {
    backgroundColor: '#e3f2fd',
  },
  moveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  currentMoveButton: {
    backgroundColor: '#2196f3',
  },
  moveText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  currentMoveText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Game;