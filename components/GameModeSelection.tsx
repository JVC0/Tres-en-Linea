import { apiService } from '@/utils/apiService';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

const GameModeSelection = ({ onSelectMode }: { 
  onSelectMode: (mode: 'single' | 'multi', boardSize?: number) => void 
}) => {
  const [selectedMode, setSelectedMode] = useState<'single' | 'multi' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);
  const [isResettingDevice, setIsResettingDevice] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    const registerDevice = async () => {
      try {
        const deviceId = await apiService.registerDevice('Player');
        setIsDeviceRegistered(true);
        setCurrentDeviceId(deviceId);
      } catch (error) {
        console.error('Failed to register device:', error);
        alert('Error al registrar el dispositivo. Inténtalo de nuevo.');
      }
    };
    
    const existingDeviceId = apiService.getCurrentDeviceId();
    if (existingDeviceId) {
      setIsDeviceRegistered(true);
      setCurrentDeviceId(existingDeviceId);
    } else {
      registerDevice();
    }
  }, []);

  const handleResetDevice = async () => {
    setIsResettingDevice(true);
    try {
      const newDeviceId = await apiService.resetDevice('Player');
      setCurrentDeviceId(newDeviceId);
      setIsDeviceRegistered(true);
      alert('Dispositivo reiniciado correctamente. Nuevo ID: ' + newDeviceId.substring(0, 8) + '...');
    } catch (error) {
      console.error('Failed to reset device:', error);
      alert('Error al reiniciar el dispositivo. Inténtalo de nuevo.');
      setIsDeviceRegistered(false);
      setCurrentDeviceId(null);
    } finally {
      setIsResettingDevice(false);
    }
  };

  const handleSinglePlayer = () => {
    if (isDeviceRegistered) {
      onSelectMode('single');
    } else {
      alert('Espera a que el dispositivo se registre...');
    }
  };

  const handleMultiPlayer = () => {
    if (isDeviceRegistered) {
      setSelectedMode('multi');
    } else {
      alert('Espera a que el dispositivo se registre...');
    }
  };

  const handleBoardSizeSelect = async (size: number) => {
    if (selectedMode === 'multi' && isDeviceRegistered) {
      setIsLoading(true);
      try {
        const result = await apiService.createMatch(size);
        
        if ('match_id' in result) {
          onSelectMode('multi', size);
        } else {
          onSelectMode('multi', size);
        }
      } catch (error) {
        console.error('Error creating match:', error);
        alert('Error al crear la partida. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isDeviceRegistered) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Registrando Dispositivo", headerShown: false }} />
        
        <Text style={styles.title}>Tres en Raya</Text>
        <Text style={styles.subtitle}>Registrando dispositivo...</Text>
        
        <View style={styles.loadingSpinner}>
          <Text style={styles.loadingText}>⏳</Text>
        </View>
        
        <Text style={styles.waitingMessage}>
          Preparando el juego...
        </Text>
      </View>
    );
  }

  if (selectedMode === 'multi') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Seleccionar Tamaño", headerShown: false }} />
        
        <Text style={styles.title}>Elige el tamaño del tablero</Text>
        <Text style={styles.subtitle}>Multijugador</Text>
        
        <ScrollView 
          contentContainerStyle={styles.sizesGrid}
          showsVerticalScrollIndicator={false}
        >
          {[3, 4, 5, 6, 7].map((size) => (
            <TouchableOpacity
              key={size}
              style={styles.sizeCard}
              onPress={() => handleBoardSizeSelect(size)}
              disabled={isLoading}
            >
              <View style={styles.previewBoard}>
                {Array.from({ length: size }).map((_, row) => (
                  <View key={row} style={styles.previewRow}>
                    {Array.from({ length: size }).map((_, col) => (
                      <View
                        key={col}
                        style={styles.previewCell}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={styles.sizeCardText}>
                {size}x{size}
              </Text>
              <Text style={styles.sizeCardSubtext}>
                {size === 3 ? 'Clásico' : 
                 size === 4 ? 'Intermedio' : 
                 size === 5 ? 'Avanzado' : 
                 size === 6 ? 'Experto' : 'Maestro'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedMode(null)}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Buscando oponente...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Modo de Juego", headerShown: false }} />
      
      <Text style={styles.title}>Tres en Raya</Text>
      <Text style={styles.subtitle}>Elige el modo de juego</Text>
      
      {currentDeviceId && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceInfoText}>
            ID: {currentDeviceId.substring(0, 8)}...
          </Text>
          <TouchableOpacity
            style={styles.resetDeviceButton}
            onPress={handleResetDevice}
            disabled={isResettingDevice}
          >
            <Text style={styles.resetDeviceButtonText}>
              {isResettingDevice ? 'Reiniciando...' : '🔄 Olvidar dispositivo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.modesContainer}>
        <TouchableOpacity
          style={[styles.modeCard, styles.singlePlayerCard]}
          onPress={handleSinglePlayer}
        >
          <Text style={styles.modeEmoji}>🎮</Text>
          <Text style={styles.modeTitle}>Un Jugador</Text>
          <Text style={styles.modeDescription}>
            Juega contra la máquina
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeCard, styles.multiPlayerCard]}
          onPress={handleMultiPlayer}
        >
          <Text style={styles.modeEmoji}>👥</Text>
          <Text style={styles.modeTitle}>Multijugador</Text>
          <Text style={styles.modeDescription}>
            Juega contra otro jugador en línea
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    maxWidth: 600,
  },
  modeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
  },
  singlePlayerCard: {
    borderColor: '#3498db',
  },
  multiPlayerCard: {
    borderColor: '#e74c3c',
  },
  modeEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  modeDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
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
    borderColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewBoard: {
    backgroundColor: '#34495e',
    borderRadius: 8,
    padding: 6,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 2,
  },
  previewCell: {
    width: 12,
    height: 12,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
  },
  sizeCardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
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
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingSpinner: {
    marginBottom: 30,
  },
  waitingMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  deviceInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 250,
  },
  deviceInfoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  resetDeviceButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetDeviceButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GameModeSelection;