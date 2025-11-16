import Game from "@/components/Game";
import GameModeSelection from "@/components/GameModeSelection";
import { Stack } from "expo-router";
import { useState } from "react";

export default function Index() {
  const [gameMode, setGameMode] = useState<'single' | 'multi' | null>(null);
  const [boardSize, setBoardSize] = useState(3);

  if (gameMode === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Tres en Raya", headerShown: false }} />
        <GameModeSelection 
          onSelectMode={(mode, size) => {
            setGameMode(mode);
            if (size) setBoardSize(size);
          }} 
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Tres en Raya", headerShown: false }} />
      <Game 
        gameMode={gameMode}
        initialBoardSize={boardSize}
        onExit={() => setGameMode(null)}
      />
    </>
  );
}