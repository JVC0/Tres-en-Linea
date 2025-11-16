import { apiService, GameState, WaitingStatus } from "@/utils/apiService";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Board from "./Board";

interface GameProps {
  gameMode: 'single' | 'multi';
  initialBoardSize?: number;
  onExit: () => void;
}

const Game = ({ gameMode, initialBoardSize = 3, onExit }: GameProps) => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [boardSize, setBoardSize] = useState(initialBoardSize);
  const [history, setHistory] = useState([Array(initialBoardSize * initialBoardSize).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [multiplayerState, setMultiplayerState] = useState<{
    matchId?: string;
    playerSymbol?: 'X' | 'O';
    isMyTurn?: boolean;
    opponentConnected?: boolean;
    status: 'waiting' | 'playing' | 'finished';
  }>({ status: 'waiting' });
  
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const keepAliveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreUpdatedForMatchRef = useRef<string | null>(null);
  const scoreUpdatedForGameRef = useRef<number>(0);
  
  const playerTurn = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const insets = useSafeAreaInsets();
  

  useEffect(() => {
    if (gameMode === 'multi') {
      initializeMultiplayer();
      startKeepAlive();
    }
    
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
        waitingTimeoutRef.current = null;
      }
      if (keepAliveTimeoutRef.current) {
        clearTimeout(keepAliveTimeoutRef.current);
        keepAliveTimeoutRef.current = null;
      }
      matchIdRef.current = null;
    };
  }, [gameMode]);

  const startKeepAlive = () => {
    if (keepAliveTimeoutRef.current) {
      clearTimeout(keepAliveTimeoutRef.current);
    }
    
    const keepAlive = async () => {
      if (gameMode !== 'multi') return;
      
      try {
        await apiService.keepAlive();
        keepAliveTimeoutRef.current = setTimeout(() => keepAlive(), 30000);
      } catch (error) {
        console.error('Error in keep-alive:', error);
        try {
          await apiService.resetDevice('Player');
          keepAliveTimeoutRef.current = setTimeout(() => keepAlive(), 30000);
        } catch (resetError) {
          console.error('Error resetting device:', resetError);
        }
      }
    };
    
    keepAliveTimeoutRef.current = setTimeout(() => keepAlive(), 30000);
  };

  const initializeMultiplayer = async () => {
    try {
      const waitingStatus = await apiService.getWaitingStatus();
      handleWaitingStatus(waitingStatus);
    } catch (error) {
      console.error('Error initializing multiplayer:', error);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  const handleWaitingStatus = (waitingStatus: WaitingStatus) => {
    if (waitingStatus.status === 'matched' && waitingStatus.match_id) {
      const deviceId = apiService.getCurrentDeviceId();
      const playerSymbol = waitingStatus.players?.[deviceId!] as 'X' | 'O';
      
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
        waitingTimeoutRef.current = null;
      }
      
      setMultiplayerState({
        matchId: waitingStatus.match_id,
        playerSymbol,
        isMyTurn: playerSymbol === 'X',
        opponentConnected: true,
        status: 'playing'
      });
      
      if (waitingStatus.board_size) {
        setBoardSize(waitingStatus.board_size);
        setHistory([Array(waitingStatus.board_size * waitingStatus.board_size).fill(null)]);
        setCurrentMove(0);
      }
      
      scoreUpdatedForMatchRef.current = null;

      startGamePolling(waitingStatus.match_id);
    } else if (waitingStatus.status === 'waiting') {
      setMultiplayerState({
        status: 'waiting'
      });

      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
      }
      waitingTimeoutRef.current = setTimeout(() => pollWaitingStatus(), 2000);
    }
  };

  const pollWaitingStatus = async () => {
    try {
      const waitingStatus = await apiService.getWaitingStatus();
      handleWaitingStatus(waitingStatus);
    } catch (error) {
      console.error('Error polling waiting status:', error);
    }
  };

  const startGamePolling = (matchId: string) => {

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    

    matchIdRef.current = matchId;
    
    const pollGameState = async () => {

      if (!matchIdRef.current) return;
      
      try {
        const gameState = await apiService.getGameState(matchIdRef.current);
        handleGameStateUpdate(gameState);
        
        setMultiplayerState(prev => {
          if (!gameState.winner && prev.status === 'playing' && matchIdRef.current) {
            pollingTimeoutRef.current = setTimeout(() => pollGameState(), 1000);
          }
          return prev;
        });
      } catch (error) {
        console.error('Error polling game state:', error);

        setMultiplayerState(prev => {
          if (prev.status === 'playing' && matchIdRef.current) {
            pollingTimeoutRef.current = setTimeout(() => pollGameState(), 2000);
          }
          return prev;
        });
      }
    };
    

    pollGameState();
  };

  const handleGameStateUpdate = (gameState: GameState) => {
 
    const flatSquares = gameState.board.flat();
    
    setHistory(prevHistory => {
      const lastSquares = prevHistory[prevHistory.length - 1] || [];
      const isDifferent = flatSquares.some((val, idx) => val !== lastSquares[idx]);
      
      if (isDifferent) {
        const newHistory = [...prevHistory, flatSquares];
        setCurrentMove(newHistory.length - 1);
        return newHistory;
      }
      return prevHistory;
    });
    
    const deviceId = apiService.getCurrentDeviceId();
    const isMyTurn = gameState.turn === deviceId;
    const isFinished = gameState.winner !== null;
    
    setMultiplayerState(prev => ({
      ...prev,
      isMyTurn,
      status: isFinished ? 'finished' : 'playing'
    }));
    

    const currentMatchId = matchIdRef.current;
    if (isFinished && currentMatchId && scoreUpdatedForMatchRef.current !== currentMatchId) {
      if (gameState.winner && gameState.winner !== 'Draw' && (gameState.winner === 'X' || gameState.winner === 'O')) {
        setScores(prev => ({
          ...prev,
          [gameState.winner!]: prev[gameState.winner as keyof typeof prev] + 1
        }));
        scoreUpdatedForMatchRef.current = currentMatchId;
      }
    }
  };
  
  async function handlePlay(nextSquares: (string | null)[]) {
    if (gameMode === 'single') {
      const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
      setHistory(nextHistory);
      setCurrentMove(nextHistory.length - 1);
      
      const winner = calculateWinner(nextSquares, boardSize);
      const allSquaresFilled = nextSquares.every(square => square === "X" || square === "O");
      const isDraw = !winner && allSquaresFilled;
      
      if (winner || isDraw) {
        const currentGameNumber = scoreUpdatedForGameRef.current + 1;
        if (winner) {
          setScores(prev => ({
            ...prev,
            [winner]: prev[winner as keyof typeof prev] + 1
          }));
        }
        scoreUpdatedForGameRef.current = currentGameNumber;
      }
    } else {
      if (multiplayerState.matchId && multiplayerState.isMyTurn) {
        const moveIndex = nextSquares.findIndex((val, idx) => 
          val !== currentSquares[idx] && val !== null
        );
        
        if (moveIndex !== -1) {
          const x = Math.floor(moveIndex / boardSize);
          const y = moveIndex % boardSize;
          
          try {
            const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
            setHistory(nextHistory);
            setCurrentMove(nextHistory.length - 1);
            

            setMultiplayerState(prev => ({
              ...prev,
              isMyTurn: false 
            }));
            
            await apiService.makeMove(multiplayerState.matchId, x, y);
            

          } catch (error) {
            console.error('Error making move:', error);
            Alert.alert('Error', 'No se pudo realizar el movimiento');
            

            setHistory(prevHistory => prevHistory.slice(0, -1));
            setCurrentMove(prevMove => Math.max(0, prevMove - 1));
            setMultiplayerState(prev => ({
              ...prev,
              isMyTurn: true 
            }));
          }
        }
      }
    }
  }
  
  function jumpTo(nextMove: number) {
    if (gameMode === 'single') {
      setCurrentMove(nextMove);
    }

  }
  
  async function handleBoardSizeChange(size: number) {
    if (gameMode === 'multi') {

      if (multiplayerState.status === 'playing' && !winner && !isDraw) {
        Alert.alert('Info', 'No puedes cambiar el tamaño durante una partida activa');
        return;
      }
      

      if (multiplayerState.status === 'playing' || multiplayerState.status === 'finished') {
        try {

          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          if (waitingTimeoutRef.current) {
            clearTimeout(waitingTimeoutRef.current);
            waitingTimeoutRef.current = null;
          }
          
      setBoardSize(size);
      setHistory([Array(size * size).fill(null)]);
      setCurrentMove(0);
      setMultiplayerState({ status: 'waiting' });
      matchIdRef.current = null;
      scoreUpdatedForMatchRef.current = null; 
          

          const result = await apiService.createMatch(size);
          if ('match_id' in result) {
            initializeMultiplayer();
          } else {
            initializeMultiplayer();
          }
        } catch (error) {
          console.error('Error creating match with new size:', error);
          Alert.alert('Error', 'No se pudo crear la partida con el nuevo tamaño');
        }
      } else {

        setBoardSize(size);
        setHistory([Array(size * size).fill(null)]);
        setCurrentMove(0);
      }
      setShowSizeSelector(false);
      return;
    }
    
    setBoardSize(size);
    setHistory([Array(size * size).fill(null)]);
    setCurrentMove(0);
    setShowSizeSelector(false);
  }
  
  async function resetGame() {
    if (gameMode === 'multi') {

      try {

        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
        if (waitingTimeoutRef.current) {
          clearTimeout(waitingTimeoutRef.current);
          waitingTimeoutRef.current = null;
        }
        

        setMultiplayerState({ status: 'waiting' });
        setHistory([Array(boardSize * boardSize).fill(null)]);
        setCurrentMove(0);
        matchIdRef.current = null;
        scoreUpdatedForMatchRef.current = null;
        

        const result = await apiService.createMatch(boardSize);
        if ('match_id' in result) {
 
          initializeMultiplayer();
        } else {

          initializeMultiplayer();
        }
      } catch (error) {
        console.error('Error creating new match:', error);
        Alert.alert('Error', 'No se pudo crear una nueva partida');
      }
      return;
    }
    
    setHistory([Array(boardSize * boardSize).fill(null)]);
    setCurrentMove(0);
    scoreUpdatedForGameRef.current = 0; 
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
  const allSquaresFilled = currentSquares.length > 0 && currentSquares.every(square => square === "X" || square === "O");
  const hasMoves = currentSquares.some(square => square === "X" || square === "O");
  const isDraw = !winner && hasMoves && allSquaresFilled;
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


  if (gameMode === 'multi' && multiplayerState.status === 'waiting') {
    return (
      <View style={[styles.container, { paddingTop: isMobile ? insets.top : 16 }]}>
        <TouchableOpacity
          style={[styles.exitButton, { top: isMobile ? insets.top + 10 : 20 }]}
          onPress={onExit}
        >
          <Text style={styles.exitButtonText}>← Salir</Text>
        </TouchableOpacity>
        
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Buscando Oponente</Text>
          <Text style={styles.waitingSubtitle}>
            Tamaño del tablero: {boardSize}x{boardSize}
          </Text>
          
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingText}>⏳</Text>
          </View>
          
          <Text style={styles.waitingMessage}>
            Esperando a que otro jugador se una a la partida...
          </Text>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onExit}
          >
            <Text style={styles.cancelButtonText}>Cancelar Búsqueda</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showSizeSelector) {
    return (
      <View style={[styles.container, { paddingTop: isMobile ? insets.top : 16 }]}>
        <TouchableOpacity
          style={[styles.exitButton, { top: isMobile ? insets.top + 10 : 20 }]}
          onPress={() => setShowSizeSelector(false)}
        >
          <Text style={styles.exitButtonText}>← Volver</Text>
        </TouchableOpacity>

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
        </View>
      </View>
    );
  }
  
  const moves = history.map((squares, move) => {
    if (gameMode === 'multi') return null; 
    
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
  }).filter(Boolean);

  const renderMultiplayerStatus = () => {
    if (gameMode !== 'multi') return null;

    return (
      <View style={[styles.multiplayerStatus, isMobile && styles.mobileMultiplayerStatus]}>
        <Text style={[styles.multiplayerText, isMobile && styles.mobileMultiplayerText]}>
          Modo: Multijugador {boardSize}x{boardSize}
        </Text>
        <Text style={[styles.multiplayerText, isMobile && styles.mobileMultiplayerText]}>
          Eres: {multiplayerState.playerSymbol === 'X' ? '❌' : '🟢'}
        </Text>
        <Text style={[
          styles.multiplayerText,
          styles.turnText,
          isMobile && styles.mobileTurnText,
          multiplayerState.isMyTurn && styles.myTurn
        ]}>
          {multiplayerState.status === 'finished' 
            ? 'Partida Terminada'
            : multiplayerState.isMyTurn 
              ? '✅ Tu turno' 
              : '⏳ Turno del oponente'
          }
        </Text>
      </View>
    );
  };

  return (        
    <View style={[styles.container, isMobile && styles.mobileContainer, { paddingTop: isMobile ? insets.top : 16 }]}>
      <TouchableOpacity
        style={[
          styles.exitButton, 
          isMobile && styles.mobileExitButton,
          { top: isMobile ? insets.top + 10 : 20 }
        ]}
        onPress={onExit}
      >
        <Text style={[styles.exitButtonText, isMobile && styles.mobileExitButtonText]}>← Salir al Menú</Text>
      </TouchableOpacity>

      <View style={[
        styles.gameContainer,
        isMobile && styles.mobileGameContainer,
        isMobile ? styles.mobileLayout : styles.desktopLayout
      ]}>
        <View style={styles.boardSection}>
          <Text style={[styles.title, isMobile && styles.mobileTitle]}>
            {gameMode === 'multi' ? 'Tres en Raya - Multijugador' : 'Tres en Raya'}
          </Text>
          
          {renderMultiplayerStatus()}
        
          <View style={[styles.scoreboard, isMobile && styles.mobileScoreboard]}>
            <View style={styles.scoreCard}>
              <Text style={[styles.scoreLabel, isMobile && styles.mobileScoreLabel]}>❌ Jugador X</Text>
              <Text style={[styles.scoreValue, isMobile && styles.mobileScoreValue]}>{scores.X}</Text>
            </View>
            <View style={[styles.scoreDivider, isMobile && styles.mobileScoreDivider]} />
            <View style={styles.scoreCard}>
              <Text style={[styles.scoreLabel, isMobile && styles.mobileScoreLabel]}>🟢 Jugador O</Text>
              <Text style={[styles.scoreValue, isMobile && styles.mobileScoreValue]}>{scores.O}</Text>
            </View>
          </View>
          
          {gameMode === 'single' && (
            <>
              <TouchableOpacity
                style={[styles.resetScoresButton, isMobile && styles.mobileResetScoresButton]}
                onPress={resetScores}
              >
                <Text style={[styles.resetScoresButtonText, isMobile && styles.mobileResetScoresButtonText]}>
                  🔄 Reiniciar marcador
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.changeSizeButton, isMobile && styles.mobileChangeSizeButton]}
                onPress={() => setShowSizeSelector(true)}
              >
                <Text style={[styles.changeSizeButtonText, isMobile && styles.mobileChangeSizeButtonText]}>
                  📐 Cambiar tamaño ({boardSize}x{boardSize})
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <Board 
            playerTurn={gameMode === 'multi' ? multiplayerState.isMyTurn! : playerTurn}
            squares={currentSquares} 
            onplay={handlePlay}
            boardSize={boardSize}
            gameMode={gameMode}
            isMyTurn={multiplayerState.isMyTurn}
            playerSymbol={gameMode === 'multi' ? multiplayerState.playerSymbol : undefined}
          />
          
          {(winner || isDraw || isGameInProgress || (gameMode === 'multi' && multiplayerState.status === 'finished')) && (
            <TouchableOpacity
              style={[styles.resetButton, isMobile && styles.mobileResetButton]}
              onPress={resetGame}
            >
              <Text style={[styles.resetButtonText, isMobile && styles.mobileResetButtonText]}>
                🎮 Nuevo juego
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {gameMode === 'single' && (
          <View style={[
            styles.historySection,
            isMobile && styles.mobileHistory
          ]}>
            <Text style={styles.historyTitle}>Historial</Text>
            <ScrollView 
              style={styles.movesContainer}
              contentContainerStyle={styles.movesContentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {[...moves].reverse()}
            </ScrollView>
          </View>
        )}
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
  mobileContainer: {
    padding: 10,
  },
  exitButton: {
    position: 'absolute',
    left: 20,
    backgroundColor: '#95a5a6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mobileExitButton: {
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileExitButtonText: {
    fontSize: 12,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 60,
  },
  waitingMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  multiplayerStatus: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 300,
    width: '90%',
    maxWidth: 350,
  },
  mobileMultiplayerStatus: {
    padding: 12,
    marginBottom: 12,
    width: '95%',
  },
  multiplayerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  mobileMultiplayerText: {
    fontSize: 14,
  },
  turnText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  mobileTurnText: {
    fontSize: 16,
  },
  myTurn: {
    color: '#27ae60',
  },
  gameContainer: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
  },
  mobileGameContainer: {
    marginTop: 10,
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
    maxHeight: 400,
    alignSelf: 'flex-start',
  },
  mobileHistory: {
    marginTop: 30,
    width: '100%',
    maxHeight: 300,
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  mobileTitle: {
    fontSize: 24,
    marginBottom: 16,
    paddingHorizontal: 10,
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
  mobileScoreboard: {
    minWidth: 'auto',
    width: '90%',
    maxWidth: 350,
    padding: 12,
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
  mobileScoreLabel: {
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  mobileScoreValue: {
    fontSize: 24,
  },
  scoreDivider: {
    width: 2,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 16,
  },
  mobileScoreDivider: {
    marginHorizontal: 12,
  },
  resetScoresButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  mobileResetScoresButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetScoresButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileResetScoresButtonText: {
    fontSize: 13,
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
  mobileChangeSizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  changeSizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mobileChangeSizeButtonText: {
    fontSize: 14,
  },
  disabledButtonText: {
    opacity: 0.5,
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
  mobileResetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mobileResetButtonText: {
    fontSize: 16,
  },
  selectorContainer: {
    flex: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 20,
    marginTop: 20,
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
    maxHeight: 120, // Height for approximately 2 move items (each ~50px + margin)
  },
  movesContentContainer: {
    paddingBottom: 10,
  },
  moveItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 50,
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