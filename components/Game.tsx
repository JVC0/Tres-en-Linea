import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Board from "./Board";

const Game = () => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [boardSize, setBoardSize] = useState(3);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const playerTurn = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  function handlePlay(nextSquares: (string | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    
    const winner = calculateWinner(nextSquares, boardSize);
    if (winner) {
      setScores(prev => ({
        ...prev,
        [winner]: prev[winner as keyof typeof prev] + 1
      }));
    }
  }
  
  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }
  
  function handleBoardSizeChange(size: number) {
    setBoardSize(size);
    setHistory([Array(size * size).fill(null)]);
    setCurrentMove(0);
    setShowSizeSelector(false);
  }
  
  function resetGame() {
    const winner = calculateWinner(currentSquares, boardSize);
    const isDraw = !winner && currentSquares.every(square => square !== null);
    
    if (!winner && !isDraw && currentMove > 0) {
      const currentPlayer = playerTurn ? "X" : "O";
      const opponent = currentPlayer === "X" ? "O" : "X";
      
      setScores(prev => ({
        ...prev,
        [opponent]: prev[opponent as keyof typeof prev] + 1
      }));
    }
    
    setHistory([Array(boardSize * boardSize).fill(null)]);
    setCurrentMove(0);
  }
  
  
  
  function calculateWinner(squares: (string | null)[], size: number) {
    const lines: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(i * size + j);
      }
      lines.push(row);
    }
    
    for (let i = 0; i < size; i++) {
      const col = [];
      for (let j = 0; j < size; j++) {
        col.push(j * size + i);
      }
      lines.push(col);
    }
    
    const diag1 = [];
    for (let i = 0; i < size; i++) {
      diag1.push(i * size + i);
    }
    lines.push(diag1);
    
    const diag2 = [];
    for (let i = 0; i < size; i++) {
      diag2.push(i * size + (size - 1 - i));
    }
    lines.push(diag2);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const first = squares[line[0]];
      if (first && line.every(index => squares[index] === first)) {
        return first;
      }
    }
    return null;
  }
  
  const winner = calculateWinner(currentSquares, boardSize);
  const isDraw = !winner && currentSquares.every(square => square !== null);
  
  const isGameInProgress = !winner && !isDraw && currentMove > 0;
  function resetScores() {
    if(!isGameInProgress){
      setScores({ X: 0, O: 0 });
    }
    
  }
  const BoardPreview = ({ size }: { size: number }) => {
    const cellSize = isMobile ? 12 : 16;
    const gap = 2;
    
    return (
      <View style={[styles.previewBoard, { padding: 6 }]}>
        {Array.from({ length: size }).map((_, row) => (
          <View key={row} style={[styles.previewRow, { gap }]}>
            {Array.from({ length: size }).map((_, col) => (
              <View
                key={col}
                style={[
                  styles.previewCell,
                  { width: cellSize, height: cellSize }
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };
  
  if (showSizeSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>Elige el tamaño del tablero</Text>
          
          <ScrollView 
            contentContainerStyle={styles.sizesGrid}
            showsVerticalScrollIndicator={false}
          >
            {[3, 4, 5, 6, 7].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeCard,
                  boardSize === size && styles.sizeCardActive
                ]}
                onPress={() => handleBoardSizeChange(size)}
              >
                <BoardPreview size={size} />
                <Text style={[
                  styles.sizeCardText,
                  boardSize === size && styles.sizeCardTextActive
                ]}>
                  {size}x{size}
                </Text>
                <Text style={styles.sizeCardSubtext}>
                  {size === 3 ? 'Clásico' : size === 4 ? 'Intermedio' : size === 5 ? 'Avanzado' : size === 6 ? 'Experto' : 'Maestro'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowSizeSelector(false)}
          >
            <Text style={styles.backButtonText}>← Volver al juego</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        
          <View style={styles.scoreboard}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>❌ Jugador X</Text>
              <Text style={styles.scoreValue}>{scores.X}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>🟢 Jugador O</Text>
              <Text style={styles.scoreValue}>{scores.O}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.resetScoresButton}
            onPress={resetScores}
          >
            <Text style={styles.resetScoresButtonText}>🔄 Reiniciar marcador</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.changeSizeButton}
            onPress={() => setShowSizeSelector(true)}
          >
            <Text style={styles.changeSizeButtonText}>
              📐 Cambiar tamaño ({boardSize}x{boardSize})
            </Text>
          </TouchableOpacity>
          
          <Board 
            playerTurn={playerTurn} 
            squares={currentSquares} 
            onplay={handlePlay}
            boardSize={boardSize}
          />
          
          {(winner || isDraw || isGameInProgress) && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetGame}
            >
              <Text style={styles.resetButtonText}>
                🎮 Nuevo juego
              </Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreboard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 300,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  scoreDivider: {
    width: 2,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 16,
  },
  resetScoresButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resetScoresButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  changeSizeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  changeSizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectorContainer: {
    flex: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  selectorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 20,
  },
  sizeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 140,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sizeCardActive: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  previewBoard: {
    backgroundColor: '#34495e',
    borderRadius: 8,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
  },
  sizeCardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sizeCardTextActive: {
    color: '#3498db',
  },
  sizeCardSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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